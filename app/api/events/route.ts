import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { events, companies, eventParticipants } from "@/lib/schema";
import { eq, desc, and, gte, lt, sql } from "drizzle-orm";
import { auth } from "@/app/api/auth/[...nextauth]/route";

// GET - Liste des événements
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get("filter"); // "upcoming", "past", "all"
    const companyOnly = searchParams.get("companyOnly") === "true";

    // Récupérer l'ID de l'entreprise de l'utilisateur connecté
    let companyId = null;
    if (session.user.accountType === "business") {
      const companyResult = await db
        .select({ id: companies.id })
        .from(companies)
        .where(eq(companies.userId, parseInt(session.user.id)))
        .limit(1);

      if (companyResult.length > 0) {
        companyId = companyResult[0].id;
      }
    }

    const now = new Date();

    // Construire les conditions de filtrage
    const conditions = [];

    if (companyOnly && companyId) {
      conditions.push(eq(events.companyId, companyId));
    }

    if (filter === "upcoming") {
      conditions.push(gte(events.startDate, now));
    } else if (filter === "past") {
      conditions.push(lt(events.startDate, now));
    }

    // Récupérer les événements avec le nombre de participants
    const allEvents = await db
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
        coordinates: events.coordinates,
        images: events.images,
        maxParticipants: events.maxParticipants,
        recurrence: events.recurrence,
        recurrenceEndDate: events.recurrenceEndDate,
        isPaid: events.isPaid,
        price: events.price,
        currency: events.currency,
        fundraisingGoal: events.fundraisingGoal,
        requirements: events.requirements,
        targetAudience: events.targetAudience,
        contactEmail: events.contactEmail,
        contactPhone: events.contactPhone,
        externalLink: events.externalLink,
        status: events.status,
        companyId: events.companyId,
        createdAt: events.createdAt,
        updatedAt: events.updatedAt,
        companyName: companies.name,
        companyLogo: companies.logo,
      })
      .from(events)
      .leftJoin(companies, eq(events.companyId, companies.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(filter === "past" ? desc(events.startDate) : events.startDate);

    // Récupérer le nombre de participants pour chaque événement
    const eventsWithParticipants = await Promise.all(
      allEvents.map(async (event) => {
        const participantCounts = await db
          .select({
            status: eventParticipants.status,
            count: sql<number>`count(*)::int`,
          })
          .from(eventParticipants)
          .where(eq(eventParticipants.eventId, event.id))
          .groupBy(eventParticipants.status);

        const confirmedCount =
          participantCounts.find((p) => p.status === "confirmed")?.count || 0;
        const waitlistedCount =
          participantCounts.find((p) => p.status === "waitlisted")?.count || 0;

        return {
          ...event,
          participantCount: confirmedCount,
          waitlistCount: waitlistedCount,
        };
      })
    );

    return NextResponse.json(eventsWithParticipants);
  } catch (error) {
    console.error("Erreur lors de la récupération des événements:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// POST - Créer un événement
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (session.user.accountType !== "business") {
      return NextResponse.json(
        { error: "Seules les associations peuvent créer des événements" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      title,
      description,
      eventType,
      startDate,
      endDate,
      location,
      address,
      city,
      coordinates,
      images,
      maxParticipants,
      recurrence,
      recurrenceEndDate,
      isPaid,
      price,
      currency,
      fundraisingGoal,
      requirements,
      targetAudience,
      contactEmail,
      contactPhone,
      externalLink,
      status,
    } = body;

    // Validation
    if (!title || title.trim().length === 0) {
      return NextResponse.json(
        { error: "Le titre de l'événement est requis" },
        { status: 400 }
      );
    }

    if (!eventType) {
      return NextResponse.json(
        { error: "Le type d'événement est requis" },
        { status: 400 }
      );
    }

    if (!startDate) {
      return NextResponse.json(
        { error: "La date de début est requise" },
        { status: 400 }
      );
    }

    // Récupérer l'ID de l'entreprise
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

    // Créer l'événement
    const newEvent = await db
      .insert(events)
      .values({
        title: title.trim(),
        description: description?.trim() || null,
        eventType,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        location: location?.trim() || null,
        address: address?.trim() || null,
        city: city?.trim() || null,
        coordinates: coordinates || null,
        images: images || [],
        maxParticipants: maxParticipants || null,
        recurrence: recurrence || "none",
        recurrenceEndDate: recurrenceEndDate
          ? new Date(recurrenceEndDate)
          : null,
        isPaid: isPaid || false,
        price: price ? String(price) : null,
        currency: currency || "EUR",
        fundraisingGoal: fundraisingGoal ? String(fundraisingGoal) : null,
        requirements: requirements?.trim() || null,
        targetAudience: targetAudience?.trim() || null,
        contactEmail: contactEmail?.trim() || null,
        contactPhone: contactPhone?.trim() || null,
        externalLink: externalLink?.trim() || null,
        status: status || "draft",
        companyId,
      })
      .returning();

    return NextResponse.json(newEvent[0], { status: 201 });
  } catch (error) {
    console.error("Erreur lors de la création de l'événement:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
