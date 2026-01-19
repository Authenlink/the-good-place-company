import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { events, companies } from "@/lib/schema";
import { eq, and, isNull, lt, desc } from "drizzle-orm";
import { auth } from "@/app/api/auth/[...nextauth]/route";

// GET - Récupérer les événements passés non validés d'une entreprise
export async function GET() {
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
    const companyResult = await db
      .select({ id: companies.id })
      .from(companies)
      .where(eq(companies.userId, parseInt(session.user.id)))
      .limit(1);

    if (companyResult.length === 0) {
      return NextResponse.json(
        { error: "Entreprise non trouvée" },
        { status: 404 }
      );
    }

    const companyId = companyResult[0].id;
    const now = new Date();

    // Récupérer les événements passés non validés (validated est null)
    const unvalidatedEvents = await db
      .select({
        id: events.id,
        title: events.title,
        description: events.description,
        eventType: events.eventType,
        startDate: events.startDate,
        endDate: events.endDate,
        location: events.location,
        address: events.address,
        city: events.city,
        status: events.status,
        companyId: events.companyId,
        createdAt: events.createdAt,
        updatedAt: events.updatedAt,
      })
      .from(events)
      .where(
        and(
          eq(events.companyId, companyId),
          eq(events.status, "published"),
          lt(events.startDate, now),
          isNull(events.validated)
        )
      )
      .orderBy(desc(events.startDate));

    return NextResponse.json(unvalidatedEvents);
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des événements non validés:",
      error
    );
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
