import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { projects, companies } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/app/api/auth/[...nextauth]/route";

// GET - Détails d'un projet
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { projectId } = await params;
    const id = parseInt(projectId);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: "ID de projet invalide" },
        { status: 400 }
      );
    }

    const project = await db
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
        companyDescription: companies.description,
      })
      .from(projects)
      .leftJoin(companies, eq(projects.companyId, companies.id))
      .where(eq(projects.id, id))
      .limit(1);

    if (project.length === 0) {
      return NextResponse.json({ error: "Projet non trouvé" }, { status: 404 });
    }

    return NextResponse.json(project[0]);
  } catch (error) {
    console.error("Erreur lors de la récupération du projet:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// PUT - Modifier un projet
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (session.user.accountType !== "business") {
      return NextResponse.json(
        { error: "Seules les associations peuvent modifier des projets" },
        { status: 403 }
      );
    }

    const { projectId } = await params;
    const id = parseInt(projectId);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: "ID de projet invalide" },
        { status: 400 }
      );
    }

    // Vérifier que le projet appartient à l'association de l'utilisateur
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

    // Vérifier que le projet appartient à cette association
    const existingProject = await db
      .select({ id: projects.id })
      .from(projects)
      .where(and(eq(projects.id, id), eq(projects.companyId, companyId)))
      .limit(1);

    if (existingProject.length === 0) {
      return NextResponse.json(
        { error: "Projet non trouvé ou non autorisé" },
        { status: 404 }
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
    if (title !== undefined && title.trim().length === 0) {
      return NextResponse.json(
        { error: "Le titre du projet ne peut pas être vide" },
        { status: 400 }
      );
    }

    // Construire l'objet de mise à jour
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (title !== undefined) updateData.title = title.trim();
    if (shortDescription !== undefined)
      updateData.shortDescription = shortDescription?.trim() || null;
    if (fullDescription !== undefined)
      updateData.fullDescription = fullDescription?.trim() || null;
    if (bannerImage !== undefined) updateData.bannerImage = bannerImage || null;
    if (carouselImages !== undefined)
      updateData.carouselImages = carouselImages || [];
    if (objectives !== undefined)
      updateData.objectives = objectives?.trim() || null;
    if (achievements !== undefined)
      updateData.achievements = achievements?.trim() || null;
    if (impact !== undefined) updateData.impact = impact?.trim() || null;
    if (tags !== undefined) updateData.tags = tags || [];
    if (customTags !== undefined) updateData.customTags = customTags || [];
    if (contactEmail !== undefined)
      updateData.contactEmail = contactEmail?.trim() || null;
    if (contactPhone !== undefined)
      updateData.contactPhone = contactPhone?.trim() || null;
    if (externalLink !== undefined)
      updateData.externalLink = externalLink?.trim() || null;
    if (status !== undefined) updateData.status = status;

    // Mettre à jour le projet
    const updatedProject = await db
      .update(projects)
      .set(updateData)
      .where(eq(projects.id, id))
      .returning();

    return NextResponse.json(updatedProject[0]);
  } catch (error) {
    console.error("Erreur lors de la modification du projet:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer un projet
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (session.user.accountType !== "business") {
      return NextResponse.json(
        { error: "Seules les associations peuvent supprimer des projets" },
        { status: 403 }
      );
    }

    const { projectId } = await params;
    const id = parseInt(projectId);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: "ID de projet invalide" },
        { status: 400 }
      );
    }

    // Vérifier que le projet appartient à l'association de l'utilisateur
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

    // Vérifier que le projet appartient à cette association
    const existingProject = await db
      .select({ id: projects.id })
      .from(projects)
      .where(and(eq(projects.id, id), eq(projects.companyId, companyId)))
      .limit(1);

    if (existingProject.length === 0) {
      return NextResponse.json(
        { error: "Projet non trouvé ou non autorisé" },
        { status: 404 }
      );
    }

    // Supprimer le projet
    await db.delete(projects).where(eq(projects.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur lors de la suppression du projet:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
