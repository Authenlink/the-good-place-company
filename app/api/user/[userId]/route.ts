import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  users,
  events,
  eventParticipants,
  companies,
  companyFollowers,
  userFollows,
} from "@/lib/schema";
import { eq, and, asc, sql } from "drizzle-orm";

// GET - Récupérer le profil public d'un utilisateur
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const userIdNum = parseInt(userId);

    if (isNaN(userIdNum)) {
      return NextResponse.json(
        { error: "ID utilisateur invalide" },
        { status: 400 }
      );
    }

    // Récupérer les informations publiques de l'utilisateur
    const userResult = await db
      .select({
        id: users.id,
        name: users.name,
        image: users.image,
        bio: users.bio,
        location: users.location,
        website: users.website,
        banner: users.banner,
        backgroundType: users.backgroundType,
        backgroundGradient: users.backgroundGradient,
        isOnline: users.isOnline,
        instagramUrl: users.instagramUrl,
        tiktokUrl: users.tiktokUrl,
        linkedinUrl: users.linkedinUrl,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, userIdNum))
      .limit(1);

    if (userResult.length === 0) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    const user = userResult[0];

    // Récupérer les événements auxquels l'utilisateur participe (confirmés uniquement)
    const userEvents = await db
      .select({
        id: events.id,
        title: events.title,
        description: events.description,
        eventType: events.eventType,
        startDate: events.startDate,
        endDate: events.endDate,
        location: events.location,
        city: events.city,
        images: events.images,
        coverImage: events.coverImage,
        status: events.status,
        companyId: events.companyId,
        companyName: companies.name,
        companyLogo: companies.logo,
        participantStatus: eventParticipants.status,
      })
      .from(eventParticipants)
      .innerJoin(events, eq(eventParticipants.eventId, events.id))
      .innerJoin(companies, eq(events.companyId, companies.id))
      .where(
        and(
          eq(eventParticipants.userId, userIdNum),
          eq(eventParticipants.status, "confirmed")
        )
      )
      .orderBy(asc(events.startDate))
      .limit(20); // Limiter à 20 événements récents

    // Récupérer les associations suivies par l'utilisateur
    const followedCompanies = await db
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
      .where(eq(companyFollowers.userId, userIdNum))
      .orderBy(asc(companyFollowers.createdAt))
      .limit(20); // Limiter à 20 associations

    // Récupérer les stats de follow
    const followingUsersResult = await db
      .select({
        count: sql<number>`count(*)::int`,
      })
      .from(userFollows)
      .where(eq(userFollows.followerId, userIdNum));

    const followingUsersCount =
      Number(followingUsersResult[0]?.count) || 0;

    const followingCompaniesResult = await db
      .select({
        count: sql<number>`count(*)::int`,
      })
      .from(companyFollowers)
      .where(eq(companyFollowers.userId, userIdNum));

    const followingCompaniesCount =
      Number(followingCompaniesResult[0]?.count) || 0;

    return NextResponse.json({
      ...user,
      events: userEvents,
      followedCompanies,
      stats: {
        followingUsers: followingUsersCount,
        followingCompanies: followingCompaniesCount,
      },
    });
  } catch (error) {
    console.error("Erreur lors de la récupération du profil:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
