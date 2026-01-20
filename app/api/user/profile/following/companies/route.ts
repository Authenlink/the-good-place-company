import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { companyFollowers, companies } from "@/lib/schema";
import { eq, desc, and, ilike } from "drizzle-orm";
import { auth } from "@/app/api/auth/[...nextauth]/route";

// GET - Liste des associations suivies par l'user connecté
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (session.user.accountType !== "user") {
      return NextResponse.json(
        { error: "Accès réservé aux utilisateurs" },
        { status: 403 }
      );
    }

    const userId = parseInt(session.user.id);

    // Récupérer le paramètre de recherche
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");

    // Construire les conditions de filtrage
    const conditions = [eq(companyFollowers.userId, userId)];

    // Ajouter le filtre de recherche par nom si fourni
    if (search && search.trim().length > 0) {
      conditions.push(ilike(companies.name, `%${search.trim()}%`));
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
      .where(and(...conditions))
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
