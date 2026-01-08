import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { projects, companies } from "@/lib/schema";
import { eq, desc, and } from "drizzle-orm";
import { auth } from "@/app/api/auth/[...nextauth]/route";

// GET - Liste des projets
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const companyOnly = searchParams.get("companyOnly") === "true";
    const status = searchParams.get("status"); // "active", "archived", ou null pour tous
    const tag = searchParams.get("tag"); // Filtrer par tag

    // Récupérer l'ID de l'entreprise de l'utilisateur connecté
    let companyId = null;
    if (session.user.accountType === "business") {
      const companyResult = await db
        .select({ id: companies.id })
        .from(companies)
        .where(eq(companies.userId, parseInt(session.user.id)))
        .limit(1);

      if (companyResult.length > 0) {
        companyId = companyResult[0].id;
      }
    }

    // Construire les conditions de filtrage
    const conditions = [];

    if (companyOnly && companyId) {
      conditions.push(eq(projects.companyId, companyId));
    }

    if (status === "active" || status === "archived") {
      conditions.push(eq(projects.status, status));
    }

    // Récupérer les projets
    const allProjects = await db
      .select({
        id: projects.id,
        title: projects.title,
        shortDescription: projects.shortDescription,
        fullDescription: projects.fullDescription,
        bannerImage: projects.bannerImage,
        carouselImages: projects.carouselImages,
        objectives: projects.objectives,
        achievements: projects.achievements,
        impact: projects.impact,
        tags: projects.tags,
        customTags: projects.customTags,
        contactEmail: projects.contactEmail,
        contactPhone: projects.contactPhone,
        externalLink: projects.externalLink,
        status: projects.status,
        companyId: projects.companyId,
        createdAt: projects.createdAt,
        updatedAt: projects.updatedAt,
        companyName: companies.name,
        companyLogo: companies.logo,
      })
      .from(projects)
      .leftJoin(companies, eq(projects.companyId, companies.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(projects.createdAt));

    // Filtrer par tag si spécifié
    let filteredProjects = allProjects;
    if (tag) {
      filteredProjects = allProjects.filter((project) => {
        const projectTags = project.tags as string[] | null;
        const projectCustomTags = project.customTags as string[] | null;
        return projectTags?.includes(tag) || projectCustomTags?.includes(tag);
      });
    }

    return NextResponse.json(filteredProjects);
  } catch (error) {
    console.error("Erreur lors de la récupération des projets:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// POST - Créer un projet
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (session.user.accountType !== "business") {
      return NextResponse.json(
        { error: "Seules les associations peuvent créer des projets" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      title,
      shortDescription,
      fullDescription,
      bannerImage,
      carouselImages,
      objectives,
      achievements,
      impact,
      tags,
      customTags,
      contactEmail,
      contactPhone,
      externalLink,
      status,
    } = body;

    // Validation
    if (!title || title.trim().length === 0) {
      return NextResponse.json(
        { error: "Le titre du projet est requis" },
        { status: 400 }
      );
    }

    // Récupérer l'ID de l'entreprise
    const companyResult = await db
      .select({ id: companies.id })
      .from(companies)
      .where(eq(companies.userId, parseInt(session.user.id)))
      .limit(1);

    if (companyResult.length === 0) {
      return NextResponse.json(
        { error: "Association non trouvée" },
        { status: 404 }
      );
    }

    const companyId = companyResult[0].id;

    // Créer le projet
    const newProject = await db
      .insert(projects)
      .values({
        title: title.trim(),
        shortDescription: shortDescription?.trim() || null,
        fullDescription: fullDescription?.trim() || null,
        bannerImage: bannerImage || null,
        carouselImages: carouselImages || [],
        objectives: objectives?.trim() || null,
        achievements: achievements?.trim() || null,
        impact: impact?.trim() || null,
        tags: tags || [],
        customTags: customTags || [],
        contactEmail: contactEmail?.trim() || null,
        contactPhone: contactPhone?.trim() || null,
        externalLink: externalLink?.trim() || null,
        status: status || "active",
        companyId,
      })
      .returning();

    return NextResponse.json(newProject[0], { status: 201 });
  } catch (error) {
    console.error("Erreur lors de la création du projet:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
