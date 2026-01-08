import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { events, companies, eventParticipants, users } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
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
        maxParticipants: events.maxParticipants,
        recurrence: events.recurrence,
        recurrenceEndDate: events.recurrenceEndDate,
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

    // Vérifier si l'utilisateur actuel est inscrit
    const currentUserParticipation = participants.find(
      (p) => p.userId === parseInt(session.user.id)
    );

    return NextResponse.json({
      ...event,
      participants,
      participantCount: confirmedCount,
      waitlistCount: waitlistedCount,
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

    // Vérifier que l'événement appartient à cette entreprise
    const eventCheck = await db
      .select({ id: events.id })
      .from(events)
      .where(and(eq(events.id, eventIdNum), eq(events.companyId, companyId)))
      .limit(1);

    if (eventCheck.length === 0) {
      return NextResponse.json(
        { error: "Événement non trouvé ou accès non autorisé" },
        { status: 404 }
      );
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
      maxParticipants,
      recurrence,
      recurrenceEndDate,
      status,
    } = body;

    // Validation
    if (title !== undefined && title.trim().length === 0) {
      return NextResponse.json(
        { error: "Le titre de l'événement ne peut pas être vide" },
        { status: 400 }
      );
    }

    // Mettre à jour l'événement
    const updatedEvent = await db
      .update(events)
      .set({
        ...(title !== undefined && { title: title.trim() }),
        ...(description !== undefined && {
          description: description?.trim() || null,
        }),
        ...(eventType !== undefined && { eventType }),
        ...(startDate !== undefined && { startDate: new Date(startDate) }),
        ...(endDate !== undefined && {
          endDate: endDate ? new Date(endDate) : null,
        }),
        ...(location !== undefined && { location: location?.trim() || null }),
        ...(address !== undefined && { address: address?.trim() || null }),
        ...(city !== undefined && { city: city?.trim() || null }),
        ...(coordinates !== undefined && { coordinates }),
        ...(images !== undefined && { images }),
        ...(maxParticipants !== undefined && { maxParticipants }),
        ...(recurrence !== undefined && { recurrence }),
        ...(recurrenceEndDate !== undefined && {
          recurrenceEndDate: recurrenceEndDate
            ? new Date(recurrenceEndDate)
            : null,
        }),
        ...(status !== undefined && { status }),
        updatedAt: new Date(),
      })
      .where(eq(events.id, eventIdNum))
      .returning();

    return NextResponse.json(updatedEvent[0]);
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

    // Vérifier que l'événement appartient à cette entreprise
    const eventCheck = await db
      .select({ id: events.id })
      .from(events)
      .where(and(eq(events.id, eventIdNum), eq(events.companyId, companyId)))
      .limit(1);

    if (eventCheck.length === 0) {
      return NextResponse.json(
        { error: "Événement non trouvé ou accès non autorisé" },
        { status: 404 }
      );
    }

    // Supprimer l'événement (les participants seront supprimés en cascade)
    await db.delete(events).where(eq(events.id, eventIdNum));

    return NextResponse.json({ message: "Événement supprimé avec succès" });
  } catch (error) {
    console.error("Erreur lors de la suppression de l'événement:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
