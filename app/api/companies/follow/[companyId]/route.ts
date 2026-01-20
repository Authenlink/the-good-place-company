import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { companyFollowers, companies } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { createNotification } from "@/lib/notifications";

// GET - Vérifier si l'user connecté suit cette association
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ isFollowing: false });
    }

    if (session.user.accountType !== "user") {
      return NextResponse.json({ isFollowing: false });
    }

    const { companyId: companyIdStr } = await params;
    const companyId = parseInt(companyIdStr);
    if (isNaN(companyId)) {
      return NextResponse.json(
        { error: "ID d'association invalide" },
        { status: 400 }
      );
    }

    const userId = parseInt(session.user.id);

    // Vérifier si l'user suit déjà cette association
    const existingFollow = await db
      .select()
      .from(companyFollowers)
      .where(
        and(
          eq(companyFollowers.companyId, companyId),
          eq(companyFollowers.userId, userId)
        )
      )
      .limit(1);

    return NextResponse.json({
      isFollowing: existingFollow.length > 0,
    });
  } catch (error) {
    console.error("Erreur lors de la vérification du follow:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// POST - Suivre une association
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (session.user.accountType !== "user") {
      return NextResponse.json(
        { error: "Seuls les utilisateurs peuvent suivre des associations" },
        { status: 403 }
      );
    }

    const { companyId: companyIdStr } = await params;
    const companyId = parseInt(companyIdStr);
    if (isNaN(companyId)) {
      return NextResponse.json(
        { error: "ID d'association invalide" },
        { status: 400 }
      );
    }

    // Vérifier que l'association existe
    const company = await db
      .select()
      .from(companies)
      .where(eq(companies.id, companyId))
      .limit(1);

    if (company.length === 0) {
      return NextResponse.json(
        { error: "Association non trouvée" },
        { status: 404 }
      );
    }

    const userId = parseInt(session.user.id);

    // Vérifier si l'user suit déjà cette association
    const existingFollow = await db
      .select()
      .from(companyFollowers)
      .where(
        and(
          eq(companyFollowers.companyId, companyId),
          eq(companyFollowers.userId, userId)
        )
      )
      .limit(1);

    if (existingFollow.length > 0) {
      return NextResponse.json(
        { error: "Vous suivez déjà cette association" },
        { status: 400 }
      );
    }

    // Créer le follow
    await db.insert(companyFollowers).values({
      companyId,
      userId,
    });

    // Créer une notification pour l'entreprise
    const companyData = company[0];
    const companyUserId = companyData.userId;
    await createNotification({
      userId: companyUserId,
      type: "company_followed",
      relatedUserId: userId,
      relatedCompanyId: companyId,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Erreur lors du follow:", error);
    // Gérer l'erreur de contrainte unique
    if (error?.code === "23505") {
      return NextResponse.json(
        { error: "Vous suivez déjà cette association" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// DELETE - Ne plus suivre une association
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (session.user.accountType !== "user") {
      return NextResponse.json(
        { error: "Seuls les utilisateurs peuvent suivre des associations" },
        { status: 403 }
      );
    }

    const { companyId: companyIdStr } = await params;
    const companyId = parseInt(companyIdStr);
    if (isNaN(companyId)) {
      return NextResponse.json(
        { error: "ID d'association invalide" },
        { status: 400 }
      );
    }

    const userId = parseInt(session.user.id);

    // Supprimer le follow
    const result = await db
      .delete(companyFollowers)
      .where(
        and(
          eq(companyFollowers.companyId, companyId),
          eq(companyFollowers.userId, userId)
        )
      )
      .returning();

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Vous ne suivez pas cette association" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur lors de l'unfollow:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
