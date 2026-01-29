import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { userCompanyMemberships, companies, users } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const targetUserId = parseInt(userId);

    if (isNaN(targetUserId)) {
      return NextResponse.json(
        { error: "ID utilisateur invalide" },
        { status: 400 }
      );
    }

    // Vérifier que l'utilisateur existe
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, targetUserId))
      .limit(1);

    if (user.length === 0) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    // Récupérer les associations auxquelles l'utilisateur appartient
    const memberships = await db
      .select({
        id: companies.id,
        name: companies.name,
        description: companies.description,
        logo: companies.logo,
        city: companies.city,
        createdAt: userCompanyMemberships.createdAt,
      })
      .from(userCompanyMemberships)
      .innerJoin(companies, eq(userCompanyMemberships.companyId, companies.id))
      .where(eq(userCompanyMemberships.userId, targetUserId))
      .orderBy(desc(userCompanyMemberships.createdAt));

    return NextResponse.json(memberships);
  } catch (error) {
    console.error("Erreur lors de la récupération des associations:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}