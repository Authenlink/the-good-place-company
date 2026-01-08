import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  companyFollowers,
  companies,
  eventParticipants,
  events,
} from "@/lib/schema";
import { eq, and, gte, sql } from "drizzle-orm";
import { auth } from "@/app/api/auth/[...nextauth]/route";

// GET - Statistiques des abonnés et participants
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (session.user.accountType !== "business") {
      return NextResponse.json(
        { error: "Accès réservé aux comptes entreprise" },
        { status: 403 }
      );
    }

    // Récupérer l'ID de l'entreprise de l'utilisateur connecté
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

    // Date de début du mois en cours
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Date de début pour le graphique (4 derniers mois)
    const fourMonthsAgo = new Date(now);
    fourMonthsAgo.setMonth(fourMonthsAgo.getMonth() - 4);

    // KPI 1: Total abonnés
    const totalFollowersResult = await db
      .select({
        count: sql<number>`count(*)::int`,
      })
      .from(companyFollowers)
      .where(eq(companyFollowers.companyId, companyId));

    const totalFollowers = Number(totalFollowersResult[0]?.count) || 0;

    // KPI 2: Nouveaux abonnés ce mois
    const newFollowersThisMonthResult = await db
      .select({
        count: sql<number>`count(*)::int`,
      })
      .from(companyFollowers)
      .where(
        and(
          eq(companyFollowers.companyId, companyId),
          gte(companyFollowers.createdAt, startOfMonth)
        )
      );

    const newFollowersThisMonth =
      Number(newFollowersThisMonthResult[0]?.count) || 0;

    // KPI 3: Total participants (uniques) à tous les événements
    const totalParticipantsResult = await db
      .select({
        count: sql<number>`count(distinct ${eventParticipants.userId})::int`,
      })
      .from(eventParticipants)
      .innerJoin(events, eq(eventParticipants.eventId, events.id))
      .where(
        and(
          eq(events.companyId, companyId),
          eq(eventParticipants.status, "confirmed")
        )
      );

    const totalParticipants = Number(totalParticipantsResult[0]?.count) || 0;

    // KPI 4: Participants ce mois (inscriptions ce mois)
    const participantsThisMonthResult = await db
      .select({
        count: sql<number>`count(distinct ${eventParticipants.userId})::int`,
      })
      .from(eventParticipants)
      .innerJoin(events, eq(eventParticipants.eventId, events.id))
      .where(
        and(
          eq(events.companyId, companyId),
          eq(eventParticipants.status, "confirmed"),
          gte(eventParticipants.createdAt, startOfMonth)
        )
      );

    const participantsThisMonth =
      Number(participantsThisMonthResult[0]?.count) || 0;

    // Données pour le graphique : nouveaux abonnés et participants par jour
    // Récupérer les données par jour pour les abonnés (non cumulatif)
    const followersByDate = await db
      .select({
        date: sql<string>`to_char(${companyFollowers.createdAt}, 'YYYY-MM-DD')`,
        count: sql<number>`count(*)::int`,
      })
      .from(companyFollowers)
      .where(
        and(
          eq(companyFollowers.companyId, companyId),
          gte(companyFollowers.createdAt, fourMonthsAgo)
        )
      )
      .groupBy(sql`to_char(${companyFollowers.createdAt}, 'YYYY-MM-DD')`)
      .orderBy(sql`to_char(${companyFollowers.createdAt}, 'YYYY-MM-DD')`);

    // Récupérer les données par jour pour les participants (non cumulatif)
    const participantsByDate = await db
      .select({
        date: sql<string>`to_char(${eventParticipants.createdAt}, 'YYYY-MM-DD')`,
        count: sql<number>`count(distinct ${eventParticipants.userId})::int`,
      })
      .from(eventParticipants)
      .innerJoin(events, eq(eventParticipants.eventId, events.id))
      .where(
        and(
          eq(events.companyId, companyId),
          eq(eventParticipants.status, "confirmed"),
          gte(eventParticipants.createdAt, fourMonthsAgo)
        )
      )
      .groupBy(sql`to_char(${eventParticipants.createdAt}, 'YYYY-MM-DD')`)
      .orderBy(sql`to_char(${eventParticipants.createdAt}, 'YYYY-MM-DD')`);

    // Créer un tableau de toutes les dates des 4 derniers mois
    const dateMap = new Map<
      string,
      { newFollowers: number; newParticipants: number }
    >();

    // Calculer le nombre de jours entre maintenant et il y a 4 mois
    const daysDiff = Math.floor(
      (now.getTime() - fourMonthsAgo.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Initialiser toutes les dates à 0
    for (let i = 0; i < daysDiff; i++) {
      const date = new Date(fourMonthsAgo);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split("T")[0];
      dateMap.set(dateStr, { newFollowers: 0, newParticipants: 0 });
    }

    // Remplir les données des abonnés (nouveaux par jour)
    followersByDate.forEach((item) => {
      const existing = dateMap.get(item.date);
      if (existing) {
        existing.newFollowers = Number(item.count) || 0;
      }
    });

    // Remplir les données des participants (nouveaux par jour)
    participantsByDate.forEach((item) => {
      const existing = dateMap.get(item.date);
      if (existing) {
        existing.newParticipants = Number(item.count) || 0;
      }
    });

    // Convertir en tableau trié par date
    const sortedDailyData = Array.from(dateMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, counts]) => ({
        date,
        newFollowers: counts.newFollowers,
        newParticipants: counts.newParticipants,
      }));

    // Appliquer un lissage simple (moyenne mobile sur 3 jours)
    const smoothedData = sortedDailyData.map((item, index) => {
      const windowSize = 3;
      const start = Math.max(0, index - Math.floor(windowSize / 2));
      const end = Math.min(
        sortedDailyData.length,
        index + Math.ceil(windowSize / 2)
      );
      const window = sortedDailyData.slice(start, end);

      const avgFollowers = Math.round(
        window.reduce((sum, d) => sum + d.newFollowers, 0) / window.length
      );
      const avgParticipants = Math.round(
        window.reduce((sum, d) => sum + d.newParticipants, 0) / window.length
      );

      return {
        date: item.date,
        newFollowers: avgFollowers,
        newParticipants: avgParticipants,
      };
    });

    // Regrouper par période de 2 jours pour la vue journalière
    const chartDataDaily: Array<{
      date: string;
      newFollowers: number;
      newParticipants: number;
    }> = [];

    for (let i = 0; i < smoothedData.length; i += 2) {
      const day1 = smoothedData[i];
      const day2 = smoothedData[i + 1] || {
        newFollowers: 0,
        newParticipants: 0,
      };

      chartDataDaily.push({
        date: day1.date, // Utiliser la date du premier jour de la période
        newFollowers: day1.newFollowers + day2.newFollowers,
        newParticipants: day1.newParticipants + day2.newParticipants,
      });
    }

    // Créer les données mensuelles (agrégation par mois)
    const monthlyMap = new Map<
      string,
      { newFollowers: number; newParticipants: number }
    >();

    chartDataDaily.forEach((item) => {
      const date = new Date(item.date);
      const monthKey = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;
      const existing = monthlyMap.get(monthKey);
      if (existing) {
        existing.newFollowers += item.newFollowers;
        existing.newParticipants += item.newParticipants;
      } else {
        monthlyMap.set(monthKey, {
          newFollowers: item.newFollowers,
          newParticipants: item.newParticipants,
        });
      }
    });

    const chartDataMonthly: Array<{
      date: string;
      newFollowers: number;
      newParticipants: number;
    }> = Array.from(monthlyMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, counts]) => ({
        date: `${date}-01`, // Premier jour du mois pour l'affichage
        newFollowers: counts.newFollowers,
        newParticipants: counts.newParticipants,
      }));

    const chartData = {
      daily: chartDataDaily,
      monthly: chartDataMonthly,
    };

    return NextResponse.json({
      kpis: {
        totalFollowers,
        newFollowersThisMonth,
        totalParticipants,
        participantsThisMonth,
      },
      chartData,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des statistiques:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
