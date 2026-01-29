import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { companies, eventParticipants, events } from "@/lib/schema";
import { eq, ilike, and, or, sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const city = searchParams.get("city");

    // Construire les conditions de filtrage
    const conditions = [];

    // Filtre par recherche (nom)
    if (search && search.trim().length > 0) {
      const searchTerm = `%${search.trim()}%`;
      conditions.push(ilike(companies.name, searchTerm));
    }

    // Filtre par ville
    if (city && city.trim().length > 0) {
      conditions.push(eq(companies.city, city.trim()));
    }

    // Récupérer toutes les associations avec leurs informations
    const companiesQuery = db
      .select({
        id: companies.id,
        name: companies.name,
        description: companies.description,
        logo: companies.logo,
        city: companies.city,
        createdAt: companies.createdAt,
      })
      .from(companies);

    // Appliquer les conditions de filtrage
    const companiesData = conditions.length > 0
      ? await companiesQuery.where(and(...conditions))
      : await companiesQuery;

    // Pour chaque association, calculer le nombre de participants uniques
    const companiesWithParticipants = await Promise.all(
      companiesData.map(async (company) => {
        // Compter les utilisateurs uniques qui ont participé à au moins un événement
        const participantsResult = await db
          .select({
            count: sql<number>`count(distinct ${eventParticipants.userId})::int`,
          })
          .from(eventParticipants)
          .innerJoin(events, eq(eventParticipants.eventId, events.id))
          .where(
            and(
              eq(events.companyId, company.id),
              or(
                eq(eventParticipants.status, "confirmed"),
                eq(eventParticipants.status, "waitlisted"),
              ),
            ),
          );

        const participantCount = participantsResult[0]?.count || 0;

        return {
          ...company,
          participantCount,
        };
      }),
    );

    // Trier par nombre de participants décroissant
    companiesWithParticipants.sort(
      (a, b) => b.participantCount - a.participantCount,
    );

    return NextResponse.json({
      companies: companiesWithParticipants,
      count: companiesWithParticipants.length,
    });
  } catch (error) {
    console.error("Erreur lors de la recherche d'associations:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 },
    );
  }
}
