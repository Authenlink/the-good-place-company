import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { eventParticipants, events } from "@/lib/schema";
import { eq, and, or, gte, lt } from "drizzle-orm";
import { auth } from "@/app/api/auth/[...nextauth]/route";

// GET - Statistiques des événements de l'utilisateur
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    const now = new Date();

    // Récupérer les événements à venir de l'utilisateur
    const upcomingEvents = await db
      .select({
        id: events.id,
        startDate: events.startDate,
        participantStatus: eventParticipants.status,
      })
      .from(eventParticipants)
      .innerJoin(events, eq(eventParticipants.eventId, events.id))
      .where(
        and(
          eq(eventParticipants.userId, userId),
          or(
            eq(eventParticipants.status, "confirmed"),
            eq(eventParticipants.status, "waitlisted")
          ),
          gte(events.startDate, now),
          eq(events.status, "published")
        )
      );

    // Compter les événements confirmés et en liste d'attente
    const confirmed = upcomingEvents.filter(
      (e) => e.participantStatus === "confirmed"
    ).length;
    const waitlisted = upcomingEvents.filter(
      (e) => e.participantStatus === "waitlisted"
    ).length;

    // Récupérer les événements passés auxquels l'utilisateur a participé (pour le graphique)
    // On va chercher les événements des 12 derniers mois
    const twelveMonthsAgo = new Date(now);
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const pastEvents = await db
      .select({
        startDate: events.startDate,
      })
      .from(eventParticipants)
      .innerJoin(events, eq(eventParticipants.eventId, events.id))
      .where(
        and(
          eq(eventParticipants.userId, userId),
          eq(eventParticipants.status, "confirmed"),
          lt(events.startDate, now),
          gte(events.startDate, twelveMonthsAgo),
          eq(events.status, "published")
        )
      );

    // Grouper par mois
    const monthlyMap = new Map<
      string,
      { eventCount: number }
    >();

    pastEvents.forEach((event) => {
      const date = new Date(event.startDate);
      const monthKey = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;
      const existing = monthlyMap.get(monthKey);
      if (existing) {
        existing.eventCount += 1;
      } else {
        monthlyMap.set(monthKey, { eventCount: 1 });
      }
    });

    // Convertir en tableau trié par date
    const chartDataMonthly: Array<{
      date: string;
      eventCount: number;
    }> = Array.from(monthlyMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, counts]) => ({
        date: `${date}-01`, // Premier jour du mois pour l'affichage
        eventCount: counts.eventCount,
      }));

    return NextResponse.json({
      upcomingEvents: {
        confirmed,
        waitlisted,
        total: confirmed + waitlisted,
      },
      chartData: {
        monthly: chartDataMonthly,
      },
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des statistiques:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
