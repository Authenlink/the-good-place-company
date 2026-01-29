import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  events,
  companies,
  eventParticipants,
  users,
  eventSlots,
  eventSlotParticipants,
  MissionType,
} from "@/lib/schema";
import { eq, and, or, inArray } from "drizzle-orm";
import { auth } from "@/app/api/auth/[...nextauth]/route";

// GET - Détail d'un événement
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { eventId } = await params;
    const eventIdNum = parseInt(eventId);

    if (isNaN(eventIdNum)) {
      return NextResponse.json(
        { error: "ID d'événement invalide" },
        { status: 400 }
      );
    }

    // Récupérer l'événement avec les infos de l'entreprise
    const eventResult = await db
      .select({
        id: events.id,
        title: events.title,
        description: events.description,
        eventType: events.eventType,
        startDate: events.startDate,
        endDate: events.endDate,
        location: events.location,
        address: events.address,
        city: events.city,
        coordinates: events.coordinates,
        images: events.images,
        coverImage: events.coverImage,
        backgroundType: events.backgroundType,
        backgroundImageIndex: events.backgroundImageIndex,
        backgroundGradient: events.backgroundGradient,
        maxParticipants: events.maxParticipants,
        recurrence: events.recurrence,
        recurrenceEndDate: events.recurrenceEndDate,
        recurrenceGroupId: events.recurrenceGroupId,
        isPaid: events.isPaid,
        price: events.price,
        currency: events.currency,
        fundraisingGoal: events.fundraisingGoal,
        requirements: events.requirements,
        targetAudience: events.targetAudience,
        contactEmail: events.contactEmail,
        contactPhone: events.contactPhone,
        externalLink: events.externalLink,
        status: events.status,
        companyId: events.companyId,
        createdAt: events.createdAt,
        updatedAt: events.updatedAt,
        companyName: companies.name,
        companyLogo: companies.logo,
      })
      .from(events)
      .leftJoin(companies, eq(events.companyId, companies.id))
      .where(eq(events.id, eventIdNum))
      .limit(1);

    if (eventResult.length === 0) {
      return NextResponse.json(
        { error: "Événement non trouvé" },
        { status: 404 }
      );
    }

    const event = eventResult[0];

    // Récupérer les participants avec leurs infos
    const participants = await db
      .select({
        id: eventParticipants.id,
        userId: eventParticipants.userId,
        status: eventParticipants.status,
        createdAt: eventParticipants.createdAt,
        userName: users.name,
        userEmail: users.email,
        userImage: users.image,
      })
      .from(eventParticipants)
      .leftJoin(users, eq(eventParticipants.userId, users.id))
      .where(eq(eventParticipants.eventId, eventIdNum));

    // Compter les participants par statut
    const confirmedCount = participants.filter(
      (p) => p.status === "confirmed"
    ).length;
    const waitlistedCount = participants.filter(
      (p) => p.status === "waitlisted"
    ).length;
    const pendingCount = participants.filter(
      (p) => p.status === "pending"
    ).length;

    // Vérifier si l'utilisateur actuel est inscrit
    const currentUserParticipation = participants.find(
      (p) => p.userId === parseInt(session.user.id)
    );

    // Récupérer les slots si l'événement a un planning
    const slots = await db
      .select()
      .from(eventSlots)
      .where(eq(eventSlots.eventId, eventIdNum))
      .orderBy(eventSlots.startTime);

    // Pour chaque slot, récupérer les participants
    const slotsWithParticipants = await Promise.all(
      slots.map(async (slot) => {
        const slotParticipants = await db
          .select({
            id: eventSlotParticipants.id,
            participantId: eventSlotParticipants.participantId,
            prefilledName: eventSlotParticipants.prefilledName,
            missionType: eventSlotParticipants.missionType,
          })
          .from(eventSlotParticipants)
          .where(eq(eventSlotParticipants.slotId, slot.id));

        const registeredCount = slotParticipants.filter(
          (p) => p.participantId !== null
        ).length;
        const prefilledCount = slotParticipants.filter(
          (p) => p.prefilledName !== null
        ).length;

        // Normaliser les missions : utiliser le nouveau format si disponible
        const missions = slot.missions || (slot.missionType ? [{
          type: slot.missionType,
          description: slot.missionDescription,
          maxParticipants: slot.maxParticipants || 10,
        }] : []);

        // Pour chaque mission, compter les participants inscrits pour cette mission spécifique
        const missionsWithCounts = missions.map((mission) => {
          // Compter les participants inscrits pour cette mission (participantId IS NOT NULL)
          const missionRegisteredCount = slotParticipants.filter(
            (p) => p.participantId !== null && p.missionType === mission.type
          ).length;

          // Compter les pré-remplis pour cette mission (prefilledName IS NOT NULL)
          const missionPrefilledCount = slotParticipants.filter(
            (p) => p.prefilledName !== null && p.missionType === mission.type
          ).length;

          return {
            ...mission,
            registeredCount: missionRegisteredCount,
            prefilledCount: missionPrefilledCount,
            availableSpots: Math.max(0, mission.maxParticipants - missionRegisteredCount),
          };
        });

        return {
          ...slot,
          missions: missionsWithCounts,
          registeredCount,
          prefilledCount,
          totalCount: registeredCount + prefilledCount,
          availableSpots: slot.maxParticipants - (registeredCount + prefilledCount),
        };
      })
    );

    return NextResponse.json({
      ...event,
      participants,
      participantCount: confirmedCount,
      waitlistCount: waitlistedCount,
      pendingCount: pendingCount,
      currentUserStatus: currentUserParticipation?.status || null,
      slots: slotsWithParticipants,
      hasPlanning: slots.length > 0,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération de l'événement:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// PUT - Modifier un événement
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (session.user.accountType !== "business") {
      return NextResponse.json(
        { error: "Seules les associations peuvent modifier des événements" },
        { status: 403 }
      );
    }

    const { eventId } = await params;
    const eventIdNum = parseInt(eventId);

    if (isNaN(eventIdNum)) {
      return NextResponse.json(
        { error: "ID d'événement invalide" },
        { status: 400 }
      );
    }

    // Vérifier que l'événement appartient à l'entreprise de l'utilisateur
    const companyResult = await db
      .select({ id: companies.id })
      .from(companies)
      .where(eq(companies.userId, parseInt(session.user.id)))
      .limit(1);

    if (companyResult.length === 0) {
      return NextResponse.json(
        { error: "Entreprise non trouvée" },
        { status: 404 }
      );
    }

    const companyId = companyResult[0].id;

    // Vérifier que l'événement appartient à cette entreprise et récupérer ses infos
    const eventCheck = await db
      .select({ 
        id: events.id,
        recurrenceGroupId: events.recurrenceGroupId,
      })
      .from(events)
      .where(and(eq(events.id, eventIdNum), eq(events.companyId, companyId)))
      .limit(1);

    if (eventCheck.length === 0) {
      return NextResponse.json(
        { error: "Événement non trouvé ou accès non autorisé" },
        { status: 404 }
      );
    }

    const event = eventCheck[0];
    let groupIdToUpdate: number | null = null;

    // Déterminer le groupe à mettre à jour
    if (event.recurrenceGroupId) {
      // L'événement fait partie d'une série, mettre à jour toute la série
      groupIdToUpdate = event.recurrenceGroupId;
    } else {
      // Vérifier si c'est le premier événement d'une série (a des événements qui le référencent)
      const linkedEvents = await db
        .select({ id: events.id })
        .from(events)
        .where(eq(events.recurrenceGroupId, eventIdNum))
        .limit(1);

      if (linkedEvents.length > 0) {
        // C'est le premier événement d'une série, mettre à jour toute la série
        groupIdToUpdate = eventIdNum;
      }
    }

    const body = await request.json();
    const {
      title,
      description,
      eventType,
      startDate,
      endDate,
      location,
      address,
      city,
      coordinates,
      images,
      coverImage,
      backgroundType,
      backgroundImageIndex,
      backgroundGradient,
      maxParticipants,
      recurrence,
      recurrenceEndDate,
      isPaid,
      price,
      currency,
      fundraisingGoal,
      requirements,
      targetAudience,
      contactEmail,
      contactPhone,
      externalLink,
      status,
      planning,
    } = body;

    // Validation
    if (title !== undefined && title.trim().length === 0) {
      return NextResponse.json(
        { error: "Le titre de l'événement ne peut pas être vide" },
        { status: 400 }
      );
    }

    // Préparer les champs à mettre à jour (sans les dates qui sont spécifiques à chaque événement)
    const updateFields: any = {
      ...(title !== undefined && { title: title.trim() }),
      ...(description !== undefined && {
        description: description?.trim() || null,
      }),
      ...(eventType !== undefined && { eventType }),
      ...(location !== undefined && { location: location?.trim() || null }),
      ...(address !== undefined && { address: address?.trim() || null }),
      ...(city !== undefined && { city: city?.trim() || null }),
      ...(coordinates !== undefined && { coordinates }),
      ...(images !== undefined && { images }),
      ...(coverImage !== undefined && { coverImage: coverImage?.trim() || null }),
      ...(backgroundType !== undefined && { backgroundType }),
      ...(backgroundImageIndex !== undefined && { backgroundImageIndex }),
      ...(backgroundGradient !== undefined && { backgroundGradient }),
      ...(maxParticipants !== undefined && { maxParticipants }),
      ...(recurrence !== undefined && { recurrence }),
      ...(recurrenceEndDate !== undefined && {
        recurrenceEndDate: recurrenceEndDate
          ? new Date(recurrenceEndDate)
          : null,
      }),
      ...(isPaid !== undefined && { isPaid }),
      ...(price !== undefined && { price: price ? String(price) : null }),
      ...(currency !== undefined && { currency }),
      ...(fundraisingGoal !== undefined && { 
        fundraisingGoal: fundraisingGoal ? String(fundraisingGoal) : null 
      }),
      ...(requirements !== undefined && { requirements: requirements?.trim() || null }),
      ...(targetAudience !== undefined && { targetAudience: targetAudience?.trim() || null }),
      ...(contactEmail !== undefined && { contactEmail: contactEmail?.trim() || null }),
      ...(contactPhone !== undefined && { contactPhone: contactPhone?.trim() || null }),
      ...(externalLink !== undefined && { externalLink: externalLink?.trim() || null }),
      ...(status !== undefined && { status }),
      updatedAt: new Date(),
    };

    // Mettre à jour tous les événements du groupe (sans modifier les dates individuelles)
    if (groupIdToUpdate !== null) {
      await db
        .update(events)
        .set(updateFields)
        .where(
          or(
            eq(events.id, groupIdToUpdate),
            eq(events.recurrenceGroupId, groupIdToUpdate)
          )
        );

      // Récupérer l'événement mis à jour pour la réponse
      const updatedEvent = await db
        .select()
        .from(events)
        .where(eq(events.id, eventIdNum))
        .limit(1);

      return NextResponse.json(updatedEvent[0]);
    } else {
      // Événement unique, mettre à jour normalement (y compris les dates)
      const updateFieldsWithDates = {
        ...updateFields,
        ...(startDate !== undefined && { startDate: new Date(startDate) }),
        ...(endDate !== undefined && {
          endDate: endDate ? new Date(endDate) : null,
        }),
      };

      const updatedEvent = await db
        .update(events)
        .set(updateFieldsWithDates)
        .where(eq(events.id, eventIdNum))
        .returning();

      // Gérer le planning si fourni
      if (planning !== undefined) {
        await updateEventSlots(
          eventIdNum,
          planning,
          startDate !== undefined ? new Date(startDate) : undefined,
          endDate !== undefined ? (endDate ? new Date(endDate) : null) : undefined
        );
      }

      return NextResponse.json(updatedEvent[0]);
    }
  } catch (error) {
    console.error("Erreur lors de la modification de l'événement:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer un événement
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (session.user.accountType !== "business") {
      return NextResponse.json(
        { error: "Seules les associations peuvent supprimer des événements" },
        { status: 403 }
      );
    }

    const { eventId } = await params;
    const eventIdNum = parseInt(eventId);

    if (isNaN(eventIdNum)) {
      return NextResponse.json(
        { error: "ID d'événement invalide" },
        { status: 400 }
      );
    }

    // Vérifier que l'événement appartient à l'entreprise de l'utilisateur
    const companyResult = await db
      .select({ id: companies.id })
      .from(companies)
      .where(eq(companies.userId, parseInt(session.user.id)))
      .limit(1);

    if (companyResult.length === 0) {
      return NextResponse.json(
        { error: "Entreprise non trouvée" },
        { status: 404 }
      );
    }

    const companyId = companyResult[0].id;

    // Vérifier que l'événement appartient à cette entreprise et récupérer ses infos
    const eventCheck = await db
      .select({ 
        id: events.id,
        recurrenceGroupId: events.recurrenceGroupId,
      })
      .from(events)
      .where(and(eq(events.id, eventIdNum), eq(events.companyId, companyId)))
      .limit(1);

    if (eventCheck.length === 0) {
      return NextResponse.json(
        { error: "Événement non trouvé ou accès non autorisé" },
        { status: 404 }
      );
    }

    const event = eventCheck[0];
    let groupIdToDelete: number | null = null;

    // Déterminer le groupe à supprimer
    if (event.recurrenceGroupId) {
      // L'événement fait partie d'une série, supprimer toute la série
      groupIdToDelete = event.recurrenceGroupId;
    } else {
      // Vérifier si c'est le premier événement d'une série (a des événements qui le référencent)
      const linkedEvents = await db
        .select({ id: events.id })
        .from(events)
        .where(eq(events.recurrenceGroupId, eventIdNum))
        .limit(1);

      if (linkedEvents.length > 0) {
        // C'est le premier événement d'une série, supprimer toute la série
        groupIdToDelete = eventIdNum;
      }
    }

    // Supprimer tous les événements du groupe
    if (groupIdToDelete !== null) {
      // Supprimer le premier événement et tous ceux qui le référencent
      await db.delete(events).where(
        or(
          eq(events.id, groupIdToDelete),
          eq(events.recurrenceGroupId, groupIdToDelete)
        )
      );
    } else {
      // Événement unique, supprimer seulement celui-ci
      await db.delete(events).where(eq(events.id, eventIdNum));
    }

    return NextResponse.json({ message: "Événement supprimé avec succès" });
  } catch (error) {
    console.error("Erreur lors de la suppression de l'événement:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// Fonction pour mettre à jour les slots d'un événement
async function updateEventSlots(
  eventId: number,
  planning: {
    enabled: boolean;
    slotDurationMinutes?: number;
    slots?: Array<{
      id?: number;
      startTime: string;
      endTime: string;
      maxParticipants: number;
      missions?: Array<{
        type: string;
        description?: string;
        maxParticipants: number;
      }>;
      missionType?: string;
      missionDescription?: string;
    }>;
  },
  eventStartDate?: Date,
  eventEndDate?: Date | null
) {
  // Récupérer les slots existants
  const existingSlots = await db
    .select({ id: eventSlots.id })
    .from(eventSlots)
    .where(eq(eventSlots.eventId, eventId));

  const existingSlotIds = existingSlots.map((s) => s.id);

  if (!planning.enabled) {
    // Si le planning est désactivé, supprimer tous les slots
    if (existingSlotIds.length > 0) {
      await db
        .delete(eventSlots)
        .where(eq(eventSlots.eventId, eventId));
    }
    return;
  }

  if (!planning.slots || planning.slots.length === 0) {
    // Si aucun slot n'est fourni mais le planning est activé, supprimer les anciens
    if (existingSlotIds.length > 0) {
      await db
        .delete(eventSlots)
        .where(eq(eventSlots.eventId, eventId));
    }
    return;
  }

  // Séparer les slots à mettre à jour (avec id) et ceux à créer (sans id)
  const slotsToUpdate = planning.slots.filter((s) => s.id !== undefined);
  const slotsToCreate = planning.slots.filter((s) => s.id === undefined);
  const updatedSlotIds = slotsToUpdate.map((s) => s.id!);

  // Supprimer les slots qui ne sont plus dans la liste
  const slotsToDelete = existingSlotIds.filter((id) => !updatedSlotIds.includes(id));
  if (slotsToDelete.length > 0) {
    await db
      .delete(eventSlots)
      .where(inArray(eventSlots.id, slotsToDelete));
  }

  // Mettre à jour les slots existants
  for (const slot of slotsToUpdate) {
    const startTime = new Date(slot.startTime);
    const endTime = new Date(slot.endTime);

    // Normaliser les missions
    const missions = slot.missions || (slot.missionType ? [{
      type: slot.missionType as MissionType,
      description: slot.missionDescription,
      maxParticipants: slot.maxParticipants || 10,
    }] : [{
      type: "autre" as MissionType,
      description: "",
      maxParticipants: slot.maxParticipants || 10,
    }]);

    await db
      .update(eventSlots)
      .set({
        startTime,
        endTime,
        maxParticipants: slot.maxParticipants,
        missions: missions as any,
        missionType: (missions[0]?.type || null) as MissionType | null,
        missionDescription: missions[0]?.description || null,
        updatedAt: new Date(),
      })
      .where(eq(eventSlots.id, slot.id!));
  }

  // Créer les nouveaux slots
  if (slotsToCreate.length > 0 && eventStartDate && eventEndDate) {
    for (const slot of slotsToCreate) {
      const startTime = new Date(slot.startTime);
      const endTime = new Date(slot.endTime);

      // Vérifier que le créneau est dans les dates de l'événement
      if (startTime < eventStartDate || endTime > eventEndDate) {
        console.warn(`Slot ignoré car hors des dates de l'événement: ${slot.startTime} - ${slot.endTime}`);
        continue;
      }

      // Normaliser les missions
      const missions = slot.missions || (slot.missionType ? [{
        type: slot.missionType as MissionType,
        description: slot.missionDescription,
        maxParticipants: slot.maxParticipants || 10,
      }] : [{
        type: "autre" as MissionType,
        description: "",
        maxParticipants: slot.maxParticipants || 10,
      }]);

      await db.insert(eventSlots).values({
        eventId: eventId,
        startTime: startTime,
        endTime: endTime,
        maxParticipants: slot.maxParticipants,
        missions: missions as any,
        missionType: (missions[0]?.type || null) as MissionType | null,
        missionDescription: missions[0]?.description || null,
      });
    }
  }
}
