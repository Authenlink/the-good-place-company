import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { events, eventParticipants, companies } from "@/lib/schema";
import { eq, and, or, sql, asc } from "drizzle-orm";
import { auth } from "@/app/api/auth/[...nextauth]/route";

// GET - Récupérer les événements de l'utilisateur connecté
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const userId = parseInt(session.user.id);

    // Récupérer tous les événements auxquels l'utilisateur est inscrit
    // (exclure les statuts "cancelled")
    const userEvents = await db
      .select({
        // Champs de l'événement
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
        // Champs de l'entreprise
        companyName: companies.name,
        companyLogo: companies.logo,
        // Statut de participation de l'utilisateur
        participantStatus: eventParticipants.status,
        participantCreatedAt: eventParticipants.createdAt,
      })
      .from(eventParticipants)
      .innerJoin(events, eq(eventParticipants.eventId, events.id))
      .innerJoin(companies, eq(events.companyId, companies.id))
      .where(
        and(
          eq(eventParticipants.userId, userId),
          or(
            eq(eventParticipants.status, "confirmed"),
            eq(eventParticipants.status, "waitlisted")
          )
        )
      )
      .orderBy(asc(events.startDate));

    // Pour chaque événement, calculer le nombre de participants confirmés et en liste d'attente
    const eventsWithCounts = await Promise.all(
      userEvents.map(async (event) => {
        // Compter les participants confirmés
        const confirmedCount = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(eventParticipants)
          .where(
            and(
              eq(eventParticipants.eventId, event.id),
              eq(eventParticipants.status, "confirmed")
            )
          );

        // Compter les participants en liste d'attente
        const waitlistedCount = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(eventParticipants)
          .where(
            and(
              eq(eventParticipants.eventId, event.id),
              eq(eventParticipants.status, "waitlisted")
            )
          );

        return {
          ...event,
          participantCount: confirmedCount[0]?.count || 0,
          waitlistCount: waitlistedCount[0]?.count || 0,
        };
      })
    );

    return NextResponse.json(eventsWithCounts);
  } catch (error) {
    console.error("Erreur lors de la récupération des événements de l'utilisateur:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
