import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { companies, areas } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    console.log("🔍 Récupération de toutes les entreprises");

    // Récupérer toutes les entreprises avec leurs informations
    const companiesData = await db
      .select({
        id: companies.id,
        name: companies.name,
        description: companies.description,
        logo: companies.logo,
        background: companies.background,
        address: companies.address,
        city: companies.city,
        coordinates: companies.coordinates, // Coordonnées GPS
        email: companies.email,
        phone: companies.phone,
        website: companies.website,
        founded: companies.founded,
        size: companies.size,
        createdAt: companies.createdAt,
        // Informations sur le secteur d'activité
        area: {
          name: areas.name,
        },
        // Valeurs de l'entreprise (JSONB array)
        values: companies.values,
      })
      .from(companies)
      .leftJoin(areas, eq(companies.areaId, areas.id));

    return NextResponse.json({
      companies: companiesData,
      count: companiesData.length,
      message: "Toutes les entreprises récupérées avec succès",
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des entreprises:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
