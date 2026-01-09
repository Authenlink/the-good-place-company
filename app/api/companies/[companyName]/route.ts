import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { companies, areas } from "@/lib/schema";
import { eq, ilike } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ companyName: string }> }
) {
  try {
    const { companyName } = await params;

    const decodedCompanyName = decodeURIComponent(companyName);

    console.log("🔍 Recherche de l'entreprise:", decodedCompanyName);

    if (!decodedCompanyName) {
      return NextResponse.json(
        { error: "Nom d'entreprise requis" },
        { status: 400 }
      );
    }

    // Récupérer l'entreprise par nom (insensible à la casse)
    const companyData = await db
      .select({
        id: companies.id,
        name: companies.name,
        description: companies.description,
        logo: companies.logo,
        background: companies.background,
        address: companies.address,
        city: companies.city,
        coordinates: companies.coordinates,
        email: companies.email,
        phone: companies.phone,
        website: companies.website,
        founded: companies.founded,
        size: companies.size,
        createdAt: companies.createdAt,
        areaId: companies.areaId,
        values: companies.values,
        // Informations sur le secteur d'activité
        area: {
          name: areas.name,
        },
      })
      .from(companies)
      .leftJoin(areas, eq(companies.areaId, areas.id))
      .where(ilike(companies.name, decodedCompanyName))
      .limit(1);

    if (companyData.length === 0) {
      return NextResponse.json(
        { error: "Entreprise non trouvée" },
        { status: 404 }
      );
    }

    const company = companyData[0];

    return NextResponse.json({
      company: company,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération de l'entreprise:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
