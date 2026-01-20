import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  companies,
  areas,
  companyValues,
  events,
  projects,
  companyFollowers,
} from "@/lib/schema";
import { eq, inArray, and, asc } from "drizzle-orm";
import { auth } from "@/app/api/auth/[...nextauth]/route";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ associationName: string }> }
) {
  try {
    const resolvedParams = await params;
    const associationName = decodeURIComponent(resolvedParams.associationName);

    // Récupérer l'association par son nom
    const association = await db
      .select({
        id: companies.id,
        name: companies.name,
        description: companies.description,
        logo: companies.logo,
        background: companies.background,
        backgroundType: companies.backgroundType,
        backgroundGradient: companies.backgroundGradient,
        address: companies.address,
        city: companies.city,
        coordinates: companies.coordinates,
        email: companies.email,
        phone: companies.phone,
        website: companies.website,
        founded: companies.founded,
        size: companies.size,
        areaId: companies.areaId,
        values: companies.values,
        isOnline: companies.isOnline,
        instagramUrl: companies.instagramUrl,
        tiktokUrl: companies.tiktokUrl,
        linkedinUrl: companies.linkedinUrl,
        createdAt: companies.createdAt,
      })
      .from(companies)
      .leftJoin(areas, eq(companies.areaId, areas.id))
      .where(eq(companies.name, associationName))
      .limit(1);

    if (!association || association.length === 0) {
      return NextResponse.json(
        { error: "Association non trouvée" },
        { status: 404 }
      );
    }

    const associationData = association[0];

    // Récupérer les noms des valeurs pour cette association
    let valueNames: { name: string; color: string }[] = [];

    if (associationData.values && associationData.values.length > 0) {
      try {
        const valuesData = await db
          .select({ name: companyValues.name, color: companyValues.color })
          .from(companyValues)
          .where(
            inArray(
              companyValues.id,
              associationData.values.map((v) => parseInt(v))
            )
          );

        valueNames = valuesData.map((v) => ({
          name: v.name,
          color: v.color,
        }));
      } catch (error) {
        console.error("Erreur lors de la récupération des valeurs:", error);
      }
    }

    // Récupérer le nom de la catégorie (secteur)
    let category = "Autre";
    if (associationData.areaId) {
      const areaData = await db
        .select({ name: areas.name })
        .from(areas)
        .where(eq(areas.id, associationData.areaId))
        .limit(1);

      if (areaData.length > 0) {
        category = areaData[0].name;
      }
    }

    // Récupérer les événements publiés de l'association
    const associationEvents = await db
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
      })
      .from(events)
      .where(
        and(
          eq(events.companyId, associationData.id),
          eq(events.status, "published")
        )
      )
      .orderBy(asc(events.startDate))
      .limit(20); // Limiter à 20 événements récents

    // Récupérer les projets actifs de l'association
    const associationProjects = await db
      .select({
        id: projects.id,
        title: projects.title,
        shortDescription: projects.shortDescription,
        fullDescription: projects.fullDescription,
        bannerImage: projects.bannerImage,
        tags: projects.tags,
        customTags: projects.customTags,
        status: projects.status,
        createdAt: projects.createdAt,
      })
      .from(projects)
      .where(
        and(
          eq(projects.companyId, associationData.id),
          eq(projects.status, "active")
        )
      )
      .orderBy(asc(projects.createdAt))
      .limit(20); // Limiter à 20 projets récents

    // Vérifier si l'user connecté suit cette association
    let isFollowing = false;
    try {
      const session = await auth();
      if (session?.user && session.user.accountType === "user") {
        const userId = parseInt(session.user.id);
        const followCheck = await db
          .select()
          .from(companyFollowers)
          .where(
            and(
              eq(companyFollowers.companyId, associationData.id),
              eq(companyFollowers.userId, userId)
            )
          )
          .limit(1);
        isFollowing = followCheck.length > 0;
      }
    } catch (error) {
      // Si erreur d'auth, on continue sans isFollowing
      console.error("Erreur lors de la vérification du follow:", error);
    }

    // Transformer les données pour correspondre au format attendu par le frontend
    const formattedAssociation = {
      id: associationData.id,
      name: associationData.name,
      description: associationData.description || "",
      logo: associationData.logo,
      banner: associationData.background, // background devient banner pour le frontend
      background: associationData.background,
      backgroundType: associationData.backgroundType,
      backgroundGradient: associationData.backgroundGradient,
      address: associationData.address,
      city: associationData.city,
      coordinates: associationData.coordinates,
      email: associationData.email,
      phone: associationData.phone,
      website: associationData.website,
      founded: associationData.founded,
      size: associationData.size,
      category: category,
      values: valueNames,
      isOnline: associationData.isOnline || false,
      instagramUrl: associationData.instagramUrl || "",
      tiktokUrl: associationData.tiktokUrl || "",
      linkedinUrl: associationData.linkedinUrl || "",
      createdAt: associationData.createdAt?.toISOString() || "",
      events: associationEvents,
      projects: associationProjects,
      isFollowing,
    };

    return NextResponse.json({
      association: formattedAssociation,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération de l'association:", error);
    return NextResponse.json(
      { error: "Erreur serveur interne" },
      { status: 500 }
    );
  }
}
