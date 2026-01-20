import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { events, eventParticipants, users, companies } from "@/lib/schema";
import { eq, and, asc } from "drizzle-orm";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { createNotification } from "@/lib/notifications";

// GET - Liste des participants d'un événement
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

    // Vérifier que l'événement existe
    const eventCheck = await db
      .select({ id: events.id })
      .from(events)
      .where(eq(events.id, eventIdNum))
      .limit(1);

    if (eventCheck.length === 0) {
      return NextResponse.json(
        { error: "Événement non trouvé" },
        { status: 404 }
      );
    }

    // Récupérer les participants
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
      .where(eq(eventParticipants.eventId, eventIdNum))
      .orderBy(asc(eventParticipants.createdAt));

    return NextResponse.json(participants);
  } catch (error) {
    console.error("Erreur lors de la récupération des participants:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// POST - S'inscrire à un événement
export async function POST(
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
    const userId = parseInt(session.user.id);

    if (isNaN(eventIdNum)) {
      return NextResponse.json(
        { error: "ID d'événement invalide" },
        { status: 400 }
      );
    }

    // Vérifier que l'événement existe et est publié
    const eventResult = await db
      .select({
        id: events.id,
        status: events.status,
        startDate: events.startDate,
        maxParticipants: events.maxParticipants,
        companyId: events.companyId,
      })
      .from(events)
      .where(eq(events.id, eventIdNum))
      .limit(1);

    if (eventResult.length === 0) {
      return NextResponse.json(
        { error: "Événement non trouvé" },
        { status: 404 }
      );
    }

    const event = eventResult[0];

    // Vérifier que l'événement est publié
    if (event.status !== "published") {
      return NextResponse.json(
        { error: "Cet événement n'accepte pas les inscriptions" },
        { status: 400 }
      );
    }

    // Vérifier que l'événement n'est pas passé
    if (new Date(event.startDate) < new Date()) {
      return NextResponse.json(
        { error: "Cet événement est déjà passé" },
        { status: 400 }
      );
    }

    // Vérifier que l'utilisateur n'est pas déjà inscrit
    const existingParticipation = await db
      .select({ id: eventParticipants.id, status: eventParticipants.status })
      .from(eventParticipants)
      .where(
        and(
          eq(eventParticipants.eventId, eventIdNum),
          eq(eventParticipants.userId, userId)
        )
      )
      .limit(1);

    if (existingParticipation.length > 0) {
      const existing = existingParticipation[0];
      if (existing.status === "cancelled") {
        // Réactiver l'inscription annulée
        const reactivated = await db
          .update(eventParticipants)
          .set({ status: "confirmed", createdAt: new Date() })
          .where(eq(eventParticipants.id, existing.id))
          .returning();
        return NextResponse.json(reactivated[0]);
      }
      return NextResponse.json(
        { error: "Vous êtes déjà inscrit à cet événement" },
        { status: 400 }
      );
    }

    // Vérifier si la validation manuelle est activée (via le body de la requête)
    let requiresManualApproval = false;
    try {
      const body = await request.json();
      requiresManualApproval = body.requiresManualApproval === true;
    } catch {
      // Pas de body, utiliser le comportement par défaut
    }

    // Déterminer le statut (pending, confirmed ou waitlisted)
    let participantStatus: "pending" | "confirmed" | "waitlisted" = "confirmed";

    if (requiresManualApproval) {
      // Si validation manuelle activée, mettre en pending
      participantStatus = "pending";
    } else if (event.maxParticipants) {
      // Compter les participants confirmés
      const confirmedCount = await db
        .select({ id: eventParticipants.id })
        .from(eventParticipants)
        .where(
          and(
            eq(eventParticipants.eventId, eventIdNum),
            eq(eventParticipants.status, "confirmed")
          )
        );

      if (confirmedCount.length >= event.maxParticipants) {
        participantStatus = "waitlisted";
      }
    }

    // Créer l'inscription
    const newParticipant = await db
      .insert(eventParticipants)
      .values({
        eventId: eventIdNum,
        userId,
        status: participantStatus,
      })
      .returning();

    // Créer une notification pour l'entreprise propriétaire de l'événement
    const eventData = eventResult[0];
    if (eventData.companyId) {
      // Récupérer le userId de l'entreprise
      const companyData = await db
        .select({ userId: companies.userId })
        .from(companies)
        .where(eq(companies.id, eventData.companyId))
        .limit(1);

      if (companyData.length > 0) {
        await createNotification({
          userId: companyData[0].userId,
          type: "event_registration",
          relatedUserId: userId,
          relatedCompanyId: eventData.companyId,
          relatedEventId: eventIdNum,
          relatedParticipantId: newParticipant[0].id,
        });
      }
    }

    return NextResponse.json(
      {
        ...newParticipant[0],
        message:
          participantStatus === "pending"
            ? "Votre candidature est en attente de validation"
            : participantStatus === "waitlisted"
            ? "Vous avez été ajouté à la liste d'attente"
            : "Inscription confirmée",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erreur lors de l'inscription:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// DELETE - Se désinscrire d'un événement
export async function DELETE(
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
    const userId = parseInt(session.user.id);

    // Vérifier si c'est une annulation admin ou utilisateur
    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get("userId");

    if (isNaN(eventIdNum)) {
      return NextResponse.json(
        { error: "ID d'événement invalide" },
        { status: 400 }
      );
    }

    let userToRemove = userId;

    // Si un targetUserId est fourni, vérifier que c'est un admin de l'événement
    if (targetUserId) {
      const companyResult = await db
        .select({ id: companies.id })
        .from(companies)
        .where(eq(companies.userId, userId))
        .limit(1);

      if (companyResult.length === 0) {
        return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
      }

      const eventCheck = await db
        .select({ id: events.id })
        .from(events)
        .where(
          and(
            eq(events.id, eventIdNum),
            eq(events.companyId, companyResult[0].id)
          )
        )
        .limit(1);

      if (eventCheck.length === 0) {
        return NextResponse.json(
          { error: "Non autorisé à gérer cet événement" },
          { status: 403 }
        );
      }

      userToRemove = parseInt(targetUserId);
    }

    // Trouver l'inscription
    const participation = await db
      .select({ id: eventParticipants.id, status: eventParticipants.status })
      .from(eventParticipants)
      .where(
        and(
          eq(eventParticipants.eventId, eventIdNum),
          eq(eventParticipants.userId, userToRemove)
        )
      )
      .limit(1);

    if (participation.length === 0) {
      return NextResponse.json(
        { error: "Inscription non trouvée" },
        { status: 404 }
      );
    }

    const wasConfirmed = participation[0].status === "confirmed";

    // Marquer comme annulé au lieu de supprimer (pour historique)
    await db
      .update(eventParticipants)
      .set({ status: "cancelled" })
      .where(eq(eventParticipants.id, participation[0].id));

    // Si le participant était confirmé et qu'il y a des gens en liste d'attente,
    // promouvoir le premier de la liste d'attente
    if (wasConfirmed) {
      const firstWaitlisted = await db
        .select({ id: eventParticipants.id })
        .from(eventParticipants)
        .where(
          and(
            eq(eventParticipants.eventId, eventIdNum),
            eq(eventParticipants.status, "waitlisted")
          )
        )
        .orderBy(asc(eventParticipants.createdAt))
        .limit(1);

      if (firstWaitlisted.length > 0) {
        await db
          .update(eventParticipants)
          .set({ status: "confirmed" })
          .where(eq(eventParticipants.id, firstWaitlisted[0].id));
      }
    }

    return NextResponse.json({
      message: "Désinscription effectuée",
      promotedFromWaitlist: wasConfirmed,
    });
  } catch (error) {
    console.error("Erreur lors de la désinscription:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
