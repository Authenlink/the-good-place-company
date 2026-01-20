import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { events, companies, eventParticipants, users } from "@/lib/schema";
import { eq, and, or } from "drizzle-orm";
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

    return NextResponse.json({
      ...event,
      participants,
      participantCount: confirmedCount,
      waitlistCount: waitlistedCount,
      pendingCount: pendingCount,
      currentUserStatus: currentUserParticipation?.status || null,
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
