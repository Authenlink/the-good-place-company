import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { userFollows, users } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";

// GET - Liste des users suivis par un user spécifique (public)
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
      .where(eq(userFollows.followerId, userId))
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
