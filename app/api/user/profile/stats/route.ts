import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { userFollows, companyFollowers, eventParticipants, posts } from "@/lib/schema";
import { eq, sql } from "drizzle-orm";
import { auth } from "@/app/api/auth/[...nextauth]/route";

// GET - Statistiques de follow pour l'user connecté
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

    // Récupérer le nombre d'utilisateurs suivis
    const followingUsersResult = await db
      .select({
        count: sql<number>`count(*)::int`,
      })
      .from(userFollows)
      .where(eq(userFollows.followerId, userId));

    const followingUsersCount =
      Number(followingUsersResult[0]?.count) || 0;

    // Récupérer le nombre d'associations suivies
    const followingCompaniesResult = await db
      .select({
        count: sql<number>`count(*)::int`,
      })
      .from(companyFollowers)
      .where(eq(companyFollowers.userId, userId));

    const followingCompaniesCount =
      Number(followingCompaniesResult[0]?.count) || 0;

    // Récupérer le nombre d'événements suivis
    const followingEventsResult = await db
      .select({
        count: sql<number>`count(*)::int`,
      })
      .from(eventParticipants)
      .where(eq(eventParticipants.userId, userId));

    const followingEventsCount =
      Number(followingEventsResult[0]?.count) || 0;

    // Récupérer le nombre de publications
    const postsResult = await db
      .select({
        count: sql<number>`count(*)::int`,
      })
      .from(posts)
      .where(eq(posts.userId, userId));

    const postsCount = Number(postsResult[0]?.count) || 0;

    return NextResponse.json({
      followingUsers: followingUsersCount,
      followingCompanies: followingCompaniesCount,
      followingEvents: followingEventsCount,
      posts: postsCount,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des stats:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
