import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { events, companies, eventParticipants } from "@/lib/schema";
import { eq, desc, and, gte, lt, sql, ilike } from "drizzle-orm";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { RecurrenceType } from "@/lib/schema";

// Fonction pour calculer les dates récurrentes
function calculateRecurrenceDates(
  startDate: Date,
  endDate: Date | null,
  recurrenceEndDate: Date,
  recurrence: RecurrenceType
): Date[] {
  const dates: Date[] = [];
  const currentDate = new Date(startDate);
  const eventDuration = endDate
    ? endDate.getTime() - startDate.getTime()
    : 0;

  while (currentDate <= recurrenceEndDate) {
    dates.push(new Date(currentDate));
    
    // Calculer la prochaine date selon le type de récurrence
    switch (recurrence) {
      case "daily":
        currentDate.setDate(currentDate.getDate() + 1);
        break;
      case "weekly":
        currentDate.setDate(currentDate.getDate() + 7);
        break;
      case "monthly":
        currentDate.setMonth(currentDate.getMonth() + 1);
        break;
      default:
        break;
    }
  }

  return dates;
}

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
    const city = searchParams.get("city"); // Filtre par ville (optionnel)

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

    // Filtrer par ville si fournie
    if (city && city.trim() !== "") {
      conditions.push(ilike(events.city, `%${city.trim()}%`));
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
        coverImage: events.coverImage,
        backgroundType: events.backgroundType,
        backgroundImageIndex: events.backgroundImageIndex,
        backgroundGradient: events.backgroundGradient,
        maxParticipants: events.maxParticipants,
        recurrence: events.recurrence,
        recurrenceEndDate: events.recurrenceEndDate,
        recurrenceGroupId: events.recurrenceGroupId,
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

    // Filtrer les événements récurrents pour ne garder que le prochain à venir
    // Identifier les séries récurrentes (premier événement avec des événements liés)
    const firstEventsInSeries = new Set<number>();
    for (const event of allEvents) {
      // Gérer le cas où recurrenceGroupId pourrait être undefined (événements existants avant migration)
      if (event.recurrenceGroupId) {
        firstEventsInSeries.add(event.recurrenceGroupId);
      }
    }
    
    // Grouper les événements par série récurrente
    const recurrenceGroups = new Map<number | null, typeof allEvents>();
    
    for (const event of allEvents) {
      let groupId: number | null = null;
      
      // Gérer le cas où recurrenceGroupId pourrait être undefined (événements existants avant migration)
      const recurrenceGroupId = event.recurrenceGroupId ?? null;
      
      if (recurrenceGroupId) {
        // Événement faisant partie d'une série (référence le premier)
        groupId = recurrenceGroupId;
      } else if (firstEventsInSeries.has(event.id)) {
        // Premier événement d'une série (a des événements qui le référencent)
        groupId = event.id;
      }
      
      if (groupId !== null) {
        if (!recurrenceGroups.has(groupId)) {
          recurrenceGroups.set(groupId, []);
        }
        recurrenceGroups.get(groupId)!.push(event);
      } else {
        // Événement unique (pas de récurrence)
        if (!recurrenceGroups.has(null)) {
          recurrenceGroups.set(null, []);
        }
        recurrenceGroups.get(null)!.push(event);
      }
    }
    
    // Pour chaque série récurrente, ne garder que le prochain événement à venir
    const filteredEvents: typeof allEvents = [];
    
    for (const [groupId, groupEvents] of recurrenceGroups.entries()) {
      if (groupId === null) {
        // Événements uniques, tous les garder
        filteredEvents.push(...groupEvents);
      } else {
        // Pour les séries récurrentes, trouver le prochain événement à venir
        const upcomingEvents = groupEvents.filter(e => e.startDate >= now);
        if (upcomingEvents.length > 0) {
          const nextEvent = upcomingEvents.sort(
            (a, b) => a.startDate.getTime() - b.startDate.getTime()
          )[0];
          filteredEvents.push(nextEvent);
        }
      }
    }

    // Récupérer le nombre de participants pour chaque événement
    const eventsWithParticipants = await Promise.all(
      filteredEvents.map(async (event) => {
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
      coverImage,
      backgroundType,
      backgroundImageIndex,
      backgroundGradient,
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

    // Validation du background
    if (backgroundType === "image") {
      // Si backgroundImageIndex est null, c'est la cover qui doit être utilisée
      if (backgroundImageIndex === null) {
        if (!coverImage) {
          return NextResponse.json(
            { error: "Image de cover requise pour le background" },
            { status: 400 }
          );
        }
      } else {
        // Sinon, vérifier que l'index pointe vers une image valide
        if (
          backgroundImageIndex === undefined ||
          !images ||
          backgroundImageIndex < 0 ||
          backgroundImageIndex >= images.length
        ) {
          return NextResponse.json(
            { error: "Index d'image de background invalide" },
            { status: 400 }
          );
        }
      }
    }

    if (backgroundType === "gradient" && !backgroundGradient) {
      return NextResponse.json(
        { error: "Gradient de background requis" },
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

    // Validation de la récurrence
    if (recurrence && recurrence !== "none" && !recurrenceEndDate) {
      return NextResponse.json(
        { error: "La date de fin de récurrence est requise pour les événements récurrents" },
        { status: 400 }
      );
    }

    const startDateTime = new Date(startDate);
    const endDateTime = endDate ? new Date(endDate) : null;
    const recurrenceEndDateTime = recurrenceEndDate
      ? new Date(recurrenceEndDate)
      : null;

    // Calculer la durée de l'événement pour la réappliquer à chaque occurrence
    const eventDuration = endDateTime
      ? endDateTime.getTime() - startDateTime.getTime()
      : null;

    // Si récurrence, créer plusieurs événements
    if (recurrence && recurrence !== "none" && recurrenceEndDateTime) {
      const recurrenceDates = calculateRecurrenceDates(
        startDateTime,
        endDateTime,
        recurrenceEndDateTime,
        recurrence as RecurrenceType
      );

      if (recurrenceDates.length === 0) {
        return NextResponse.json(
          { error: "Aucune date récurrente valide trouvée" },
          { status: 400 }
        );
      }

      // Créer tous les événements séquentiellement (neon-http ne supporte pas les transactions)
      const eventValues = {
        title: title.trim(),
        description: description?.trim() || null,
        eventType,
        location: location?.trim() || null,
        address: address?.trim() || null,
        city: city?.trim() || null,
        coordinates: coordinates || null,
        images: images || [],
        coverImage: coverImage?.trim() || null,
        backgroundType: backgroundType || null,
        backgroundImageIndex:
          backgroundType === "image" ? backgroundImageIndex : null,
        backgroundGradient:
          backgroundType === "gradient" ? backgroundGradient : null,
        maxParticipants: maxParticipants || null,
        recurrence: recurrence || "none",
        recurrenceEndDate: recurrenceEndDateTime,
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
      };

      // Créer le premier événement (recurrenceGroupId = null)
      const firstEvent = await db
        .insert(events)
        .values({
          ...eventValues,
          startDate: recurrenceDates[0],
          endDate: eventDuration
            ? new Date(recurrenceDates[0].getTime() + eventDuration)
            : null,
          recurrenceGroupId: null,
        })
        .returning();

      const firstEventId = firstEvent[0].id;

      // Créer les événements suivants avec recurrenceGroupId = firstEventId
      if (recurrenceDates.length > 1) {
        for (const date of recurrenceDates.slice(1)) {
          await db.insert(events).values({
            ...eventValues,
            startDate: date,
            endDate: eventDuration
              ? new Date(date.getTime() + eventDuration)
              : null,
            recurrenceGroupId: firstEventId,
          });
        }
      }

      return NextResponse.json(firstEvent[0], { status: 201 });
    }

    // Créer un événement unique (pas de récurrence)
    const newEvent = await db
      .insert(events)
      .values({
        title: title.trim(),
        description: description?.trim() || null,
        eventType,
        startDate: startDateTime,
        endDate: endDateTime,
        location: location?.trim() || null,
        address: address?.trim() || null,
        city: city?.trim() || null,
        coordinates: coordinates || null,
        images: images || [],
        coverImage: coverImage?.trim() || null,
        backgroundType: backgroundType || null,
        backgroundImageIndex:
          backgroundType === "image" ? backgroundImageIndex : null,
        backgroundGradient:
          backgroundType === "gradient" ? backgroundGradient : null,
        maxParticipants: maxParticipants || null,
        recurrence: recurrence || "none",
        recurrenceEndDate: recurrenceEndDateTime,
        recurrenceGroupId: null,
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
