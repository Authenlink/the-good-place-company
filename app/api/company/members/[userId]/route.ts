import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { userCompanyMemberships, companies } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import type { MemberType } from "@/lib/schema";

// DELETE - Retirer un membre de l'entreprise
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
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

    const { userId: userIdStr } = await params;
    const targetUserId = parseInt(userIdStr);

    if (isNaN(targetUserId)) {
      return NextResponse.json(
        { error: "ID utilisateur invalide" },
        { status: 400 }
      );
    }

    // Récupérer l'ID de l'entreprise de l'utilisateur connecté
    const businessUserId = parseInt(session.user.id);
    const companyResult = await db
      .select({ id: companies.id })
      .from(companies)
      .where(eq(companies.userId, businessUserId))
      .limit(1);

    if (companyResult.length === 0) {
      return NextResponse.json(
        { error: "Association non trouvée" },
        { status: 404 }
      );
    }

    const companyId = companyResult[0].id;

    // Supprimer le membership
    const result = await db
      .delete(userCompanyMemberships)
      .where(
        and(
          eq(userCompanyMemberships.companyId, companyId),
          eq(userCompanyMemberships.userId, targetUserId)
        )
      )
      .returning();

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Ce membre n'appartient pas à votre association" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur lors de la suppression du membre:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// PATCH - Modifier le type de membre
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
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

    const { userId: userIdStr } = await params;
    const targetUserId = parseInt(userIdStr);

    if (isNaN(targetUserId)) {
      return NextResponse.json(
        { error: "ID utilisateur invalide" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { memberType } = body;

    if (!memberType || (memberType !== "volunteer" && memberType !== "permanent_member")) {
      return NextResponse.json(
        { error: "Type de membre invalide" },
        { status: 400 }
      );
    }

    // Récupérer l'ID de l'entreprise de l'utilisateur connecté
    const businessUserId = parseInt(session.user.id);
    const companyResult = await db
      .select({ id: companies.id })
      .from(companies)
      .where(eq(companies.userId, businessUserId))
      .limit(1);

    if (companyResult.length === 0) {
      return NextResponse.json(
        { error: "Association non trouvée" },
        { status: 404 }
      );
    }

    const companyId = companyResult[0].id;

    // Mettre à jour le type de membre
    const result = await db
      .update(userCompanyMemberships)
      .set({ memberType: memberType as MemberType })
      .where(
        and(
          eq(userCompanyMemberships.companyId, companyId),
          eq(userCompanyMemberships.userId, targetUserId)
        )
      )
      .returning();

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Ce membre n'appartient pas à votre association" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, memberType });
  } catch (error) {
    console.error("Erreur lors de la mise à jour du membre:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
