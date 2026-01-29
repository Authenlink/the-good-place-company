import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { userCompanyMemberships, companies } from "@/lib/schema";
import { eq, and, desc } from "drizzle-orm";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { createNotification } from "@/lib/notifications";
import type { MemberType } from "@/lib/schema";

// GET - Liste des associations auxquelles l'utilisateur appartient
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (session.user.accountType !== "user") {
      return NextResponse.json(
        { error: "Accès réservé aux utilisateurs" },
        { status: 403 },
      );
    }

    const userId = parseInt(session.user.id);

    // Récupérer les associations avec leurs informations
    const memberships = await db
      .select({
        id: companies.id,
        name: companies.name,
        description: companies.description,
        logo: companies.logo,
        city: companies.city,
        memberType: userCompanyMemberships.memberType,
        createdAt: userCompanyMemberships.createdAt,
      })
      .from(userCompanyMemberships)
      .innerJoin(companies, eq(userCompanyMemberships.companyId, companies.id))
      .where(eq(userCompanyMemberships.userId, userId))
      .orderBy(desc(userCompanyMemberships.createdAt));

    return NextResponse.json(memberships);
  } catch (error) {
    console.error("Erreur lors de la récupération des associations:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 },
    );
  }
}

// POST - Ajouter une association
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (session.user.accountType !== "user") {
      return NextResponse.json(
        { error: "Seuls les utilisateurs peuvent ajouter des associations" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { companyId, memberType } = body;

    if (!companyId || typeof companyId !== "number") {
      return NextResponse.json(
        { error: "ID d'association requis" },
        { status: 400 },
      );
    }

    // Valider memberType ou utiliser la valeur par défaut
    const validMemberType: MemberType = 
      memberType === "volunteer" || memberType === "permanent_member"
        ? memberType
        : "volunteer";

    // Vérifier que l'association existe et récupérer son userId
    const company = await db
      .select({
        id: companies.id,
        userId: companies.userId,
      })
      .from(companies)
      .where(eq(companies.id, companyId))
      .limit(1);

    if (company.length === 0) {
      return NextResponse.json(
        { error: "Association non trouvée" },
        { status: 404 },
      );
    }

    const companyData = company[0];

    const userId = parseInt(session.user.id);

    // Vérifier si l'utilisateur appartient déjà à cette association
    const existingMembership = await db
      .select()
      .from(userCompanyMemberships)
      .where(
        and(
          eq(userCompanyMemberships.companyId, companyId),
          eq(userCompanyMemberships.userId, userId),
        ),
      )
      .limit(1);

    if (existingMembership.length > 0) {
      return NextResponse.json(
        { error: "Vous appartenez déjà à cette association" },
        { status: 400 },
      );
    }

    // Créer le membership
    await db.insert(userCompanyMemberships).values({
      companyId,
      userId,
      memberType: validMemberType,
    });

    // Créer une notification pour l'association
    try {
      await createNotification({
        userId: companyData.userId,
        type: "member_joined",
        relatedUserId: userId,
        relatedCompanyId: companyId,
      });
    } catch (notificationError) {
      // Ne pas bloquer l'ajout si la notification échoue
      console.error("Erreur lors de la création de la notification:", notificationError);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Erreur lors de l'ajout de l'association:", error);
    // Gérer l'erreur de contrainte unique
    if (error?.code === "23505") {
      return NextResponse.json(
        { error: "Vous appartenez déjà à cette association" },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 },
    );
  }
}
