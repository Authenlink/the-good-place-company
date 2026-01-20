import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { companyFollowers, companies, users } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";

// GET - Liste des associations suivies par un user spécifique (public)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId: userIdStr } = await params;
    const userId = parseInt(userIdStr);
    if (isNaN(userId)) {
      return NextResponse.json(
        { error: "ID utilisateur invalide" },
        { status: 400 }
      );
    }

    // Vérifier que l'user existe
    const userExists = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (userExists.length === 0) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    // Récupérer les associations suivies avec leurs informations
    const following = await db
      .select({
        id: companies.id,
        name: companies.name,
        description: companies.description,
        logo: companies.logo,
        city: companies.city,
        createdAt: companyFollowers.createdAt,
      })
      .from(companyFollowers)
      .innerJoin(companies, eq(companyFollowers.companyId, companies.id))
      .where(eq(companyFollowers.userId, userId))
      .orderBy(desc(companyFollowers.createdAt));

    return NextResponse.json(following);
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des associations suivies:",
      error
    );
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
