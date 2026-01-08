import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { companyFollowers, companies, users } from "@/lib/schema";
import { eq, desc, and, ilike, or } from "drizzle-orm";
import { auth } from "@/app/api/auth/[...nextauth]/route";

// GET - Liste des abonnés de l'entreprise
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

    // Récupérer le paramètre de recherche
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");

    // Construire les conditions de filtrage
    const conditions = [eq(companyFollowers.companyId, companyId)];

    // Ajouter le filtre de recherche par nom si fourni
    if (search && search.trim().length > 0) {
      conditions.push(
        or(
          ilike(users.name, `%${search.trim()}%`),
          ilike(users.email, `%${search.trim()}%`)
        )!
      );
    }

    // Récupérer les abonnés avec les informations utilisateur
    const followers = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        image: users.image,
        createdAt: companyFollowers.createdAt,
      })
      .from(companyFollowers)
      .innerJoin(users, eq(companyFollowers.userId, users.id))
      .where(and(...conditions))
      .orderBy(desc(companyFollowers.createdAt));

    return NextResponse.json(followers);
  } catch (error) {
    console.error("Erreur lors de la récupération des abonnés:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
