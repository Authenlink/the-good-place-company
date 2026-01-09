import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { companies } from "@/lib/schema";
import { sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Comptage des associations par ville");

    // Récupérer le comptage des entreprises par ville
    const cityCounts = await db
      .select({
        city: companies.city,
        count: sql<number>`count(*)`.as("count"),
      })
      .from(companies)
      .where(sql`${companies.city} IS NOT NULL`)
      .groupBy(companies.city)
      .orderBy(sql`count(*) DESC`);

    console.log(
      `📊 ${cityCounts.length} villes trouvées avec des associations`
    );

    return NextResponse.json({
      cities: cityCounts,
      total: cityCounts.reduce((sum, city) => sum + city.count, 0),
    });
  } catch (error) {
    console.error("Erreur lors du comptage des associations par ville:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
