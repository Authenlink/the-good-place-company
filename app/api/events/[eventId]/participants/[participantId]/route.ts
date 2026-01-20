import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { events, eventParticipants, companies } from "@/lib/schema";
import { eq, and, asc } from "drizzle-orm";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { ParticipantStatus } from "@/lib/schema";
import { createNotification } from "@/lib/notifications";

// PATCH - Modifier le statut d'un participant (valider/refuser)
export async function PATCH(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{ eventId: string; participantId: string }>;
  }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (session.user.accountType !== "business") {
      return NextResponse.json(
        { error: "Seules les associations peuvent gérer les inscriptions" },
        { status: 403 }
      );
    }

    const { eventId, participantId } = await params;
    const eventIdNum = parseInt(eventId);
    const participantIdNum = parseInt(participantId);

    if (isNaN(eventIdNum) || isNaN(participantIdNum)) {
      return NextResponse.json(
        { error: "ID invalide" },
        { status: 400 }
      );
    }

    // Vérifier que l'utilisateur est propriétaire de l'événement
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
      .select({
        id: events.id,
        maxParticipants: events.maxParticipants,
      })
      .from(events)
      .where(
        and(eq(events.id, eventIdNum), eq(events.companyId, companyId))
      )
      .limit(1);

    if (eventCheck.length === 0) {
      return NextResponse.json(
        { error: "Événement non trouvé ou accès non autorisé" },
        { status: 404 }
      );
    }

    const event = eventCheck[0];

    // Récupérer le participant
    const participantResult = await db
      .select({
        id: eventParticipants.id,
        userId: eventParticipants.userId,
        status: eventParticipants.status,
      })
      .from(eventParticipants)
      .where(
        and(
          eq(eventParticipants.id, participantIdNum),
          eq(eventParticipants.eventId, eventIdNum)
        )
      )
      .limit(1);

    if (participantResult.length === 0) {
      return NextResponse.json(
        { error: "Participant non trouvé" },
        { status: 404 }
      );
    }

    const participant = participantResult[0];
    const body = await request.json();
    const { status: newStatus } = body;

    if (!newStatus || typeof newStatus !== "string") {
      return NextResponse.json(
        { error: "Statut invalide" },
        { status: 400 }
      );
    }

    // Valider les transitions de statut
    const validStatuses: ParticipantStatus[] = [
      "pending",
      "confirmed",
      "waitlisted",
      "cancelled",
    ];
    if (!validStatuses.includes(newStatus as ParticipantStatus)) {
      return NextResponse.json(
        { error: "Statut invalide" },
        { status: 400 }
      );
    }

    // Vérifier les transitions valides
    const currentStatus = participant.status;
    const validTransitions: Record<
      ParticipantStatus,
      ParticipantStatus[]
    > = {
      pending: ["confirmed", "waitlisted", "cancelled"],
      confirmed: ["cancelled"],
      waitlisted: ["confirmed", "cancelled"],
      cancelled: [], // Une fois annulé, on ne peut plus changer
    };

    if (
      !validTransitions[currentStatus as ParticipantStatus]?.includes(
        newStatus as ParticipantStatus
      )
    ) {
      return NextResponse.json(
        {
          error: `Transition invalide de ${currentStatus} vers ${newStatus}`,
        },
        { status: 400 }
      );
    }

    // Si on passe à "confirmed", vérifier qu'il y a de la place
    if (newStatus === "confirmed") {
      if (event.maxParticipants) {
        const confirmedCount = await db
          .select({ id: eventParticipants.id })
          .from(eventParticipants)
          .where(
            and(
              eq(eventParticipants.eventId, eventIdNum),
              eq(eventParticipants.status, "confirmed")
            )
          );

        // Si le participant était déjà confirmé, on ne compte pas deux fois
        const wasAlreadyConfirmed = currentStatus === "confirmed";
        const currentCount = confirmedCount.length - (wasAlreadyConfirmed ? 1 : 0);

        if (currentCount >= event.maxParticipants) {
          // Pas de place, passer en waitlisted si ce n'était pas déjà le cas
          if (currentStatus !== "waitlisted") {
            await db
              .update(eventParticipants)
              .set({ status: "waitlisted" })
              .where(eq(eventParticipants.id, participantIdNum));

            return NextResponse.json({
              message: "Pas de place disponible, ajouté à la liste d'attente",
              status: "waitlisted",
            });
          } else {
            return NextResponse.json(
              {
                error: "Pas de place disponible",
              },
              { status: 400 }
            );
          }
        }
      }
    }

    // Mettre à jour le statut
    await db
      .update(eventParticipants)
      .set({ status: newStatus as ParticipantStatus })
      .where(eq(eventParticipants.id, participantIdNum));

    // Créer une notification pour l'utilisateur si le statut change vers confirmed, rejected ou waitlisted
    if (
      (newStatus === "confirmed" ||
        newStatus === "waitlisted" ||
        newStatus === "rejected") &&
      participant.userId
    ) {
      let notificationType:
        | "event_registration_confirmed"
        | "event_registration_rejected"
        | "event_registration_waitlisted";

      if (newStatus === "confirmed") {
        notificationType = "event_registration_confirmed";
      } else if (newStatus === "rejected") {
        notificationType = "event_registration_rejected";
      } else {
        notificationType = "event_registration_waitlisted";
      }

      await createNotification({
        userId: participant.userId,
        type: notificationType,
        relatedEventId: eventIdNum,
        relatedParticipantId: participantIdNum,
      });
    }

    // Si on passe de confirmed à cancelled, promouvoir le premier de la liste d'attente
    if (currentStatus === "confirmed" && newStatus === "cancelled") {
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

        // Notifier l'utilisateur promu
        const promotedParticipant = await db
          .select({ userId: eventParticipants.userId })
          .from(eventParticipants)
          .where(eq(eventParticipants.id, firstWaitlisted[0].id))
          .limit(1);

        if (promotedParticipant.length > 0) {
          await createNotification({
            userId: promotedParticipant[0].userId,
            type: "event_registration_confirmed",
            relatedEventId: eventIdNum,
            relatedParticipantId: firstWaitlisted[0].id,
          });
        }
      }
    }

    return NextResponse.json({
      message: "Statut mis à jour avec succès",
      status: newStatus,
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour du statut:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
