import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { companies } from "@/lib/schema";
import { isNull } from "drizzle-orm";

export async function GET() {
  try {
    // Récupérer les entreprises sans coordonnées
    const companiesWithoutCoords = await db
      .select({
        id: companies.id,
        name: companies.name,
        address: companies.address,
        city: companies.city,
        coordinates: companies.coordinates,
      })
      .from(companies)
      .where(isNull(companies.coordinates));

    return NextResponse.json({
      companies: companiesWithoutCoords,
      count: companiesWithoutCoords.length,
    });
  } catch (error) {
    console.error("Erreur récupération entreprises sans coordonnées:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
