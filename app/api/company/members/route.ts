import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { userCompanyMemberships, companies, users } from "@/lib/schema";
import { eq, and, or, ilike, desc } from "drizzle-orm";
import { auth } from "@/app/api/auth/[...nextauth]/route";

export async function GET(request: NextRequest) {
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

    // Récupérer l'ID de l'entreprise de l'utilisateur connecté
    const userId = parseInt(session.user.id);
    const companyResult = await db
      .select({ id: companies.id })
      .from(companies)
      .where(eq(companies.userId, userId))
      .limit(1);

    if (companyResult.length === 0) {
      return NextResponse.json(
        { error: "Association non trouvée" },
        { status: 404 }
      );
    }

    const companyId = companyResult[0].id;

    // Récupérer les paramètres de recherche et filtrage
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const memberType = searchParams.get("memberType");

    // Construire les conditions
    const conditions = [eq(userCompanyMemberships.companyId, companyId)];

    // Ajouter le filtre par type de membre si fourni
    if (memberType && (memberType === "volunteer" || memberType === "permanent_member")) {
      conditions.push(eq(userCompanyMemberships.memberType, memberType));
    }

    // Ajouter le filtre de recherche par nom/email si fourni
    if (search && search.trim().length > 0) {
      conditions.push(
        or(
          ilike(users.name, `%${search.trim()}%`),
          ilike(users.email, `%${search.trim()}%`)
        )!
      );
    }

    // Récupérer les membres avec leurs informations utilisateur
    const members = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        image: users.image,
        memberType: userCompanyMemberships.memberType,
        joinedAt: userCompanyMemberships.createdAt,
      })
      .from(userCompanyMemberships)
      .innerJoin(users, eq(userCompanyMemberships.userId, users.id))
      .where(and(...conditions))
      .orderBy(desc(userCompanyMemberships.createdAt));

    return NextResponse.json({ members });
  } catch (error) {
    console.error("Erreur lors de la récupération des membres:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
