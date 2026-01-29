import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { userCompanyMemberships } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/app/api/auth/[...nextauth]/route";

// DELETE - Retirer une association
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (session.user.accountType !== "user") {
      return NextResponse.json(
        { error: "Seuls les utilisateurs peuvent retirer des associations" },
        { status: 403 },
      );
    }

    const { companyId: companyIdStr } = await params;
    const companyId = parseInt(companyIdStr);
    if (isNaN(companyId)) {
      return NextResponse.json(
        { error: "ID d'association invalide" },
        { status: 400 },
      );
    }

    const userId = parseInt(session.user.id);

    // Supprimer le membership
    const result = await db
      .delete(userCompanyMemberships)
      .where(
        and(
          eq(userCompanyMemberships.companyId, companyId),
          eq(userCompanyMemberships.userId, userId),
        ),
      )
      .returning();

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Vous n'appartenez pas à cette association" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur lors de la suppression de l'association:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 },
    );
  }
}
