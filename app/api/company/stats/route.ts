import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { companies, events, companyFollowers } from "@/lib/schema";
import { eq, sql } from "drizzle-orm";
import { auth } from "@/app/api/auth/[...nextauth]/route";

export async function GET(request: NextRequest) {
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
    const now = new Date();

    // Compter les événements actifs (validés et à venir ou en cours)
    // Pour les événements simples : startDate >= now OU (startDate <= now ET endDate >= now)
    // Pour les événements récurrents : recurrenceEndDate >= now
    const activeEventsCount = await db
      .select({
        count: sql<number>`count(*)::int`,
      })
      .from(events)
      .where(
        sql`${events.companyId} = ${companyId} AND ${events.status} = 'validated' AND (
          (${events.startDate} >= ${now} OR (${events.startDate} <= ${now} AND ${events.endDate} >= ${now})) OR
          (${events.recurrence} IS NOT NULL AND ${events.recurrenceEndDate} >= ${now})
        )`
      );

    // Compter les abonnés
    const followersCount = await db
      .select({
        count: sql<number>`count(*)::int`,
      })
      .from(companyFollowers)
      .where(eq(companyFollowers.companyId, companyId));

    const stats = {
      activeEvents: activeEventsCount[0]?.count || 0,
      followers: followersCount[0]?.count || 0,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Erreur lors de la récupération des statistiques:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}