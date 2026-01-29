import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  events,
  companies,
  eventSlots,
  eventSlotParticipants,
} from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/app/api/auth/[...nextauth]/route";

// POST - Pré-remplir un slot avec un nom (membre non-inscrit)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string; slotId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (session.user.accountType !== "business") {
      return NextResponse.json(
        { error: "Seules les associations peuvent pré-remplir des créneaux" },
        { status: 403 }
      );
    }

    const { eventId, slotId } = await params;
    const eventIdNum = parseInt(eventId);
    const slotIdNum = parseInt(slotId);

    if (isNaN(eventIdNum) || isNaN(slotIdNum)) {
      return NextResponse.json(
        { error: "ID invalide" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name } = body;

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Le nom est requis" },
        { status: 400 }
      );
    }

    // Vérifier que l'événement appartient à l'entreprise de l'utilisateur
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

    // Vérifier que le slot appartient à un événement de cette entreprise
    const slotCheck = await db
      .select({
        slotId: eventSlots.id,
        maxParticipants: eventSlots.maxParticipants,
      })
      .from(eventSlots)
      .innerJoin(events, eq(eventSlots.eventId, events.id))
      .where(
        and(
          eq(eventSlots.id, slotIdNum),
          eq(eventSlots.eventId, eventIdNum),
          eq(events.companyId, companyId)
        )
      )
      .limit(1);

    if (slotCheck.length === 0) {
      return NextResponse.json(
        { error: "Créneau non trouvé ou accès non autorisé" },
        { status: 404 }
      );
    }

    const slot = slotCheck[0];

    // Compter les participants actuels (inscrits + pré-remplis)
    const currentParticipants = await db
      .select()
      .from(eventSlotParticipants)
      .where(eq(eventSlotParticipants.slotId, slotIdNum));

    const totalCount = currentParticipants.length;

    if (totalCount >= slot.maxParticipants) {
      return NextResponse.json(
        { error: "Le créneau est complet" },
        { status: 400 }
      );
    }

    // Créer le pré-remplissage
    const prefilled = await db
      .insert(eventSlotParticipants)
      .values({
        slotId: slotIdNum,
        participantId: null,
        prefilledName: name.trim(),
      })
      .returning();

    return NextResponse.json(prefilled[0], { status: 201 });
  } catch (error) {
    console.error("Erreur lors du pré-remplissage:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// DELETE - Retirer un pré-remplissage
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string; slotId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (session.user.accountType !== "business") {
      return NextResponse.json(
        { error: "Seules les associations peuvent retirer des pré-remplissages" },
        { status: 403 }
      );
    }

    const { eventId, slotId } = await params;
    const { searchParams } = new URL(request.url);
    const prefillId = searchParams.get("prefillId");

    if (!prefillId) {
      return NextResponse.json(
        { error: "ID du pré-remplissage requis" },
        { status: 400 }
      );
    }

    const prefillIdNum = parseInt(prefillId);
    if (isNaN(prefillIdNum)) {
      return NextResponse.json(
        { error: "ID du pré-remplissage invalide" },
        { status: 400 }
      );
    }

    // Vérifier que l'événement appartient à l'entreprise de l'utilisateur
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

    // Vérifier que le pré-remplissage appartient à un slot d'un événement de cette entreprise
    const prefillCheck = await db
      .select({
        prefillId: eventSlotParticipants.id,
      })
      .from(eventSlotParticipants)
      .innerJoin(eventSlots, eq(eventSlotParticipants.slotId, eventSlots.id))
      .innerJoin(events, eq(eventSlots.eventId, events.id))
      .where(
        and(
          eq(eventSlotParticipants.id, prefillIdNum),
          eq(events.companyId, companyId)
        )
      )
      .limit(1);

    if (prefillCheck.length === 0) {
      return NextResponse.json(
        { error: "Pré-remplissage non trouvé ou accès non autorisé" },
        { status: 404 }
      );
    }

    // Supprimer le pré-remplissage
    await db
      .delete(eventSlotParticipants)
      .where(eq(eventSlotParticipants.id, prefillIdNum));

    return NextResponse.json({ message: "Pré-remplissage retiré avec succès" });
  } catch (error) {
    console.error("Erreur lors de la suppression du pré-remplissage:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
