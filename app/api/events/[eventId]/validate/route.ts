import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { events, companies } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/app/api/auth/[...nextauth]/route";

// PUT - Valider un événement (marquer comme présent ou absent)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
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

    const { eventId } = await params;
    const eventIdNum = parseInt(eventId);

    if (isNaN(eventIdNum)) {
      return NextResponse.json(
        { error: "ID d'événement invalide" },
        { status: 400 }
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

    // Vérifier que l'événement existe et appartient à l'entreprise
    const eventResult = await db
      .select({
        id: events.id,
        companyId: events.companyId,
        startDate: events.startDate,
      })
      .from(events)
      .where(eq(events.id, eventIdNum))
      .limit(1);

    if (eventResult.length === 0) {
      return NextResponse.json(
        { error: "Événement non trouvé" },
        { status: 404 }
      );
    }

    const event = eventResult[0];

    if (event.companyId !== companyId) {
      return NextResponse.json(
        { error: "Vous n'avez pas accès à cet événement" },
        { status: 403 }
      );
    }

    // Vérifier que l'événement est passé
    const now = new Date();
    if (new Date(event.startDate) >= now) {
      return NextResponse.json(
        { error: "Vous ne pouvez valider que les événements passés" },
        { status: 400 }
      );
    }

    // Récupérer la valeur de validation depuis le body
    const body = await request.json();
    const { validated } = body;

    if (typeof validated !== "boolean") {
      return NextResponse.json(
        { error: "Le champ validated doit être un booléen (true/false)" },
        { status: 400 }
      );
    }

    // Mettre à jour l'événement
    const updatedEvent = await db
      .update(events)
      .set({ validated })
      .where(eq(events.id, eventIdNum))
      .returning();

    return NextResponse.json({
      ...updatedEvent[0],
      message: validated
        ? "Événement validé comme présent"
        : "Événement validé comme absent",
    });
  } catch (error) {
    console.error("Erreur lors de la validation de l'événement:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
