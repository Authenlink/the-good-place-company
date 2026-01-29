import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  events,
  companies,
  eventSlots,
  eventSlotParticipants,
  eventParticipants,
  users,
} from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/app/api/auth/[...nextauth]/route";

// GET - Récupérer tous les slots d'un événement
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

    // Récupérer les slots de l'événement
    const slots = await db
      .select()
      .from(eventSlots)
      .where(eq(eventSlots.eventId, eventIdNum))
      .orderBy(eventSlots.startTime);

    // Pour chaque slot, récupérer les participants (inscrits et pré-remplis) avec leurs infos utilisateur
    const slotsWithParticipants = await Promise.all(
      slots.map(async (slot) => {
        // Récupérer les participants avec leurs infos utilisateur
        const slotParticipantsData = await db
          .select({
            id: eventSlotParticipants.id,
            participantId: eventSlotParticipants.participantId,
            prefilledName: eventSlotParticipants.prefilledName,
            missionType: eventSlotParticipants.missionType,
            createdAt: eventSlotParticipants.createdAt,
            // Infos utilisateur via eventParticipants
            userId: eventParticipants.userId,
            userName: users.name,
            userEmail: users.email,
            userImage: users.image,
          })
          .from(eventSlotParticipants)
          .leftJoin(
            eventParticipants,
            eq(eventSlotParticipants.participantId, eventParticipants.id)
          )
          .leftJoin(users, eq(eventParticipants.userId, users.id))
          .where(eq(eventSlotParticipants.slotId, slot.id));

        // Transformer les données pour avoir une structure cohérente
        const slotParticipants = slotParticipantsData.map((p) => ({
          id: p.id,
          participantId: p.participantId,
          prefilledName: p.prefilledName,
          missionType: p.missionType,
          createdAt: p.createdAt,
          userId: p.userId,
          userName: p.userName,
          userEmail: p.userEmail,
          userImage: p.userImage,
        }));

        // Normaliser les missions : utiliser le nouveau format si disponible
        const missions = slot.missions || (slot.missionType ? [{
          type: slot.missionType,
          description: slot.missionDescription,
          maxParticipants: slot.maxParticipants || 10,
        }] : []);

        // Pour chaque mission, récupérer les participants et compter
        const missionsWithParticipants = missions.map((mission) => {
          // Filtrer les participants pour cette mission spécifique
          const missionParticipants = slotParticipants.filter(
            (p) => p.missionType === mission.type
          );

          const missionRegisteredCount = missionParticipants.filter(
            (p) => p.participantId !== null
          ).length;

          const missionPrefilledCount = missionParticipants.filter(
            (p) => p.prefilledName !== null
          ).length;

          return {
            ...mission,
            participants: missionParticipants,
            registeredCount: missionRegisteredCount,
            prefilledCount: missionPrefilledCount,
            availableSpots: Math.max(0, mission.maxParticipants - missionRegisteredCount - missionPrefilledCount),
          };
        });

        // Compter les participants inscrits (avec userId)
        const registeredCount = slotParticipants.filter(
          (p) => p.participantId !== null
        ).length;

        // Compter les pré-remplis
        const prefilledCount = slotParticipants.filter(
          (p) => p.prefilledName !== null
        ).length;

        return {
          ...slot,
          participants: slotParticipants,
          missions: missionsWithParticipants,
          registeredCount,
          prefilledCount,
          totalCount: registeredCount + prefilledCount,
          availableSpots: slot.maxParticipants - (registeredCount + prefilledCount),
        };
      })
    );

    return NextResponse.json(slotsWithParticipants);
  } catch (error) {
    console.error("Erreur lors de la récupération des slots:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// POST - Créer un slot pour un événement
export async function POST(
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
        { error: "Seules les associations peuvent créer des créneaux" },
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

    // Vérifier que l'événement appartient à cette entreprise
    const eventCheck = await db
      .select({ id: events.id, startDate: events.startDate, endDate: events.endDate })
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
    const body = await request.json();
    const { startTime, endTime, maxParticipants, missions, missionType, missionDescription } = body;

    // Validation
    if (!startTime || !endTime) {
      return NextResponse.json(
        { error: "Les horaires de début et de fin sont requis" },
        { status: 400 }
      );
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (start >= end) {
      return NextResponse.json(
        { error: "L'heure de fin doit être après l'heure de début" },
        { status: 400 }
      );
    }

    // Vérifier que le créneau est dans les dates de l'événement
    const eventStart = new Date(event.startDate);
    const eventEnd = event.endDate ? new Date(event.endDate) : null;

    if (start < eventStart || (eventEnd && end > eventEnd)) {
      return NextResponse.json(
        { error: "Le créneau doit être dans les dates de l'événement" },
        { status: 400 }
      );
    }

    if (!maxParticipants || maxParticipants < 1) {
      return NextResponse.json(
        { error: "Le nombre maximum de participants doit être au moins 1" },
        { status: 400 }
      );
    }

    // Normaliser les missions : utiliser le nouveau format si disponible, sinon convertir l'ancien
    let normalizedMissions: Array<{
      type: string;
      description?: string;
      maxParticipants: number;
    }> = [];

    if (missions && Array.isArray(missions) && missions.length > 0) {
      // Nouveau format : tableau de missions
      normalizedMissions = missions;
    } else if (missionType) {
      // Ancien format : convertir en nouveau format
      normalizedMissions = [{
        type: missionType,
        description: missionDescription,
        maxParticipants: maxParticipants || 10,
      }];
    } else {
      return NextResponse.json(
        { error: "Au moins une mission est requise (missions ou missionType)" },
        { status: 400 }
      );
    }

    if (normalizedMissions.length === 0) {
      return NextResponse.json(
        { error: "Au moins une mission est requise" },
        { status: 400 }
      );
    }

    // Vérifier qu'il n'y a pas de chevauchement avec d'autres créneaux
    const existingSlots = await db
      .select()
      .from(eventSlots)
      .where(eq(eventSlots.eventId, eventIdNum));

    // Vérification manuelle du chevauchement
    const hasOverlap = existingSlots.some((slot) => {
      const slotStart = new Date(slot.startTime);
      const slotEnd = new Date(slot.endTime);
      // Chevauchement : start < slotEnd ET end > slotStart
      return start < slotEnd && end > slotStart;
    });

    if (hasOverlap) {
      return NextResponse.json(
        { error: "Ce créneau chevauche avec un autre créneau existant" },
        { status: 400 }
      );
    }

    // Créer le slot
    const newSlot = await db
      .insert(eventSlots)
      .values({
        eventId: eventIdNum as any,
        startTime: start,
        endTime: end,
        maxParticipants,
        missions: normalizedMissions,
        // Garder les anciens champs pour compatibilité
        missionType: normalizedMissions[0]?.type || null,
        missionDescription: normalizedMissions[0]?.description || null,
      } as any)
      .returning();

    return NextResponse.json(newSlot[0], { status: 201 });
  } catch (error) {
    console.error("Erreur lors de la création du slot:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// PUT - Modifier un slot
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
        { error: "Seules les associations peuvent modifier des créneaux" },
        { status: 403 }
      );
    }

    const { eventId } = await params;
    const eventIdNum = parseInt(eventId);

    const body = await request.json();
    const { slotId, startTime, endTime, maxParticipants, missions, missionType, missionDescription } = body;

    if (!slotId) {
      return NextResponse.json(
        { error: "ID du créneau requis" },
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

    // Vérifier que le slot appartient à un événement de cette entreprise
    const slotCheck = await db
      .select({
        slotId: eventSlots.id,
        eventId: eventSlots.eventId,
        companyId: events.companyId,
      })
      .from(eventSlots)
      .innerJoin(events, eq(eventSlots.eventId, events.id))
      .where(and(eq(eventSlots.id, slotId), eq(events.companyId, companyId)))
      .limit(1);

    if (slotCheck.length === 0) {
      return NextResponse.json(
        { error: "Créneau non trouvé ou accès non autorisé" },
        { status: 404 }
      );
    }

    const updateFields: any = {
      updatedAt: new Date(),
    };

    if (startTime !== undefined) updateFields.startTime = new Date(startTime);
    if (endTime !== undefined) updateFields.endTime = new Date(endTime);
    if (maxParticipants !== undefined) updateFields.maxParticipants = maxParticipants;
    
    // Gérer les missions (nouveau format)
    if (missions !== undefined) {
      updateFields.missions = missions;
      // Mettre à jour aussi les anciens champs pour compatibilité
      if (missions.length > 0) {
        updateFields.missionType = missions[0].type;
        updateFields.missionDescription = missions[0].description || null;
      }
    } else if (missionType !== undefined) {
      // Ancien format : convertir en nouveau format
      updateFields.missionType = missionType;
      if (missionDescription !== undefined) {
        updateFields.missionDescription = missionDescription?.trim() || null;
      }
      // Créer un tableau de missions à partir de l'ancien format
      const currentSlot = await db
        .select()
        .from(eventSlots)
        .where(eq(eventSlots.id, slotId))
        .limit(1);
      
      if (currentSlot.length > 0) {
        const existingMissions = currentSlot[0].missions || [];
        if (existingMissions.length === 0) {
          updateFields.missions = [{
            type: missionType,
            description: missionDescription?.trim() || null,
            maxParticipants: maxParticipants || currentSlot[0].maxParticipants || 10,
          }];
        }
      }
    }

    // Validation si les dates sont modifiées
    if (startTime || endTime) {
      const currentSlot = await db
        .select()
        .from(eventSlots)
        .where(eq(eventSlots.id, slotId))
        .limit(1);

      if (currentSlot.length === 0) {
        return NextResponse.json(
          { error: "Créneau non trouvé" },
          { status: 404 }
        );
      }

      const start = updateFields.startTime || new Date(currentSlot[0].startTime);
      const end = updateFields.endTime || new Date(currentSlot[0].endTime);

      if (start >= end) {
        return NextResponse.json(
          { error: "L'heure de fin doit être après l'heure de début" },
          { status: 400 }
        );
      }

      // Vérifier le chevauchement avec d'autres créneaux (sauf celui-ci)
      const existingSlots = await db
        .select()
        .from(eventSlots)
        .where(
          and(
            eq(eventSlots.eventId, slotCheck[0].eventId),
            // Exclure le slot actuel
          )
        );

      const hasOverlap = existingSlots
        .filter((s) => s.id !== slotId)
        .some((slot) => {
          const slotStart = new Date(slot.startTime);
          const slotEnd = new Date(slot.endTime);
          return start < slotEnd && end > slotStart;
        });

      if (hasOverlap) {
        return NextResponse.json(
          { error: "Ce créneau chevauche avec un autre créneau existant" },
          { status: 400 }
        );
      }
    }

    const updatedSlot = await db
      .update(eventSlots)
      .set(updateFields)
      .where(eq(eventSlots.id, slotId))
      .returning();

    return NextResponse.json(updatedSlot[0]);
  } catch (error) {
    console.error("Erreur lors de la modification du slot:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer un slot
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
        { error: "Seules les associations peuvent supprimer des créneaux" },
        { status: 403 }
      );
    }

    const { eventId } = await params;
    const { searchParams } = new URL(request.url);
    const slotId = searchParams.get("slotId");

    if (!slotId) {
      return NextResponse.json(
        { error: "ID du créneau requis" },
        { status: 400 }
      );
    }

    const slotIdNum = parseInt(slotId);
    if (isNaN(slotIdNum)) {
      return NextResponse.json(
        { error: "ID du créneau invalide" },
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

    // Vérifier que le slot appartient à un événement de cette entreprise
    const slotCheck = await db
      .select({
        slotId: eventSlots.id,
      })
      .from(eventSlots)
      .innerJoin(events, eq(eventSlots.eventId, events.id))
      .where(and(eq(eventSlots.id, slotIdNum), eq(events.companyId, companyId)))
      .limit(1);

    if (slotCheck.length === 0) {
      return NextResponse.json(
        { error: "Créneau non trouvé ou accès non autorisé" },
        { status: 404 }
      );
    }

    // Supprimer le slot (les participants seront supprimés en cascade)
    await db.delete(eventSlots).where(eq(eventSlots.id, slotIdNum));

    return NextResponse.json({ message: "Créneau supprimé avec succès" });
  } catch (error) {
    console.error("Erreur lors de la suppression du slot:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
