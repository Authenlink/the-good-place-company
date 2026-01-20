import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { userFollows, users } from "@/lib/schema";
import { eq, desc, and, ilike, or } from "drizzle-orm";
import { auth } from "@/app/api/auth/[...nextauth]/route";

// GET - Liste des users suivis par l'user connecté
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
    const conditions = [eq(userFollows.followerId, userId)];

    // Ajouter le filtre de recherche par nom si fourni
    if (search && search.trim().length > 0) {
      conditions.push(
        or(
          ilike(users.name, `%${search.trim()}%`),
          ilike(users.email, `%${search.trim()}%`)
        )!
      );
    }

    // Récupérer les users suivis avec leurs informations
    const following = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        image: users.image,
        bio: users.bio,
        createdAt: userFollows.createdAt,
      })
      .from(userFollows)
      .innerJoin(users, eq(userFollows.followingId, users.id))
      .where(and(...conditions))
      .orderBy(desc(userFollows.createdAt));

    return NextResponse.json(following);
  } catch (error) {
    console.error("Erreur lors de la récupération des users suivis:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
