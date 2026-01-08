import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { companies, areas } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/app/api/auth/[...nextauth]/route";

export async function GET(request: NextRequest) {
  try {
    // Récupérer la session utilisateur
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

    const userId = parseInt(session.user.id);

    // Récupération des données de l'entreprise avec les informations de secteur
    const result = await db
      .select({
        id: companies.id,
        name: companies.name,
        description: companies.description,
        logo: companies.logo,
        background: companies.background,
        areaId: companies.areaId,
        areaName: areas.name,
        values: companies.values,
        email: companies.email,
        phone: companies.phone,
        address: companies.address,
        website: companies.website,
        founded: companies.founded,
        size: companies.size,
        createdAt: companies.createdAt,
        updatedAt: companies.updatedAt,
      })
      .from(companies)
      .leftJoin(areas, eq(companies.areaId, areas.id))
      .where(eq(companies.userId, userId))
      .limit(1);

    if (result.length === 0) {
      // Si aucune entreprise n'existe, retourner un objet vide
      return NextResponse.json({
        id: null,
        name: "",
        description: "",
        email: "",
        phone: "",
        address: "",
        website: "",
        founded: "",
        size: "",
        logo: "",
        background: "",
        areaId: null,
        areaName: null,
        values: [],
        createdAt: null,
        updatedAt: null,
      });
    }

    const company = result[0];

    return NextResponse.json({
      id: company.id,
      name: company.name,
      description: company.description,
      logo: company.logo,
      background: company.background,
      areaId: company.areaId?.toString() || "",
      areaName: company.areaName,
      values: company.values || [],
      email: company.email,
      phone: company.phone,
      address: company.address,
      website: company.website,
      founded: company.founded,
      size: company.size,
      createdAt: company.createdAt,
      updatedAt: company.updatedAt,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération de l'entreprise:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
