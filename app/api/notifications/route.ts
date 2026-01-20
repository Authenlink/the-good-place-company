import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { notifications, users, companies, posts, events, NOTIFICATION_TYPES } from "@/lib/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { auth } from "@/app/api/auth/[...nextauth]/route";

// GET - Récupérer les notifications de l'utilisateur connecté
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const userId = parseInt(session.user.id);

    // Récupérer les paramètres de pagination
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const type = searchParams.get("type");
    const unreadOnly = searchParams.get("unreadOnly") === "true";

    const offset = (page - 1) * limit;

    // Construire les conditions
    const conditions = [eq(notifications.userId, userId)];

    if (type && Object.keys(NOTIFICATION_TYPES).includes(type)) {
      conditions.push(eq(notifications.type, type as keyof typeof NOTIFICATION_TYPES));
    }

    if (unreadOnly) {
      conditions.push(eq(notifications.read, false));
    }

    // Récupérer les notifications avec les données liées
    const notificationsList = await db
      .select({
        id: notifications.id,
        type: notifications.type,
        message: notifications.message,
        read: notifications.read,
        createdAt: notifications.createdAt,
        relatedUserId: notifications.relatedUserId,
        relatedCompanyId: notifications.relatedCompanyId,
        relatedPostId: notifications.relatedPostId,
        relatedEventId: notifications.relatedEventId,
        relatedCommentId: notifications.relatedCommentId,
        relatedEventCommentId: notifications.relatedEventCommentId,
        relatedParticipantId: notifications.relatedParticipantId,
        // Données liées pour l'affichage
        relatedUser: {
          id: users.id,
          name: users.name,
          image: users.image,
        },
        relatedCompany: {
          id: companies.id,
          name: companies.name,
          logo: companies.logo,
        },
        relatedPost: {
          id: posts.id,
          content: posts.content,
        },
        relatedEvent: {
          id: events.id,
          title: events.title,
        },
      })
      .from(notifications)
      .leftJoin(users, eq(notifications.relatedUserId, users.id))
      .leftJoin(companies, eq(notifications.relatedCompanyId, companies.id))
      .leftJoin(posts, eq(notifications.relatedPostId, posts.id))
      .leftJoin(events, eq(notifications.relatedEventId, events.id))
      .where(and(...conditions))
      .orderBy(desc(notifications.createdAt))
      .limit(limit)
      .offset(offset);

    // Compter le total pour la pagination
    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(and(...conditions));

    const total = Number(totalResult[0]?.count || 0);

    return NextResponse.json({
      notifications: notificationsList,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des notifications:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// PATCH - Marquer une notification comme lue (ou plusieurs via query params)
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    const { searchParams } = new URL(request.url);
    const notificationId = searchParams.get("id");

    if (notificationId) {
      // Marquer une notification spécifique comme lue
      const notificationIdNum = parseInt(notificationId);
      if (isNaN(notificationIdNum)) {
        return NextResponse.json(
          { error: "ID de notification invalide" },
          { status: 400 }
        );
      }

      // Vérifier que la notification appartient à l'utilisateur
      const notification = await db
        .select()
        .from(notifications)
        .where(
          and(
            eq(notifications.id, notificationIdNum),
            eq(notifications.userId, userId)
          )
        )
        .limit(1);

      if (notification.length === 0) {
        return NextResponse.json(
          { error: "Notification non trouvée" },
          { status: 404 }
        );
      }

      // Marquer comme lue
      await db
        .update(notifications)
        .set({ read: true })
        .where(eq(notifications.id, notificationIdNum));

      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: "ID de notification requis" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la notification:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer une notification (ou plusieurs via query params)
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    const { searchParams } = new URL(request.url);
    const notificationId = searchParams.get("id");

    if (notificationId) {
      const notificationIdNum = parseInt(notificationId);
      if (isNaN(notificationIdNum)) {
        return NextResponse.json(
          { error: "ID de notification invalide" },
          { status: 400 }
        );
      }

      // Vérifier que la notification appartient à l'utilisateur et supprimer
      const result = await db
        .delete(notifications)
        .where(
          and(
            eq(notifications.id, notificationIdNum),
            eq(notifications.userId, userId)
          )
        )
        .returning();

      if (result.length === 0) {
        return NextResponse.json(
          { error: "Notification non trouvée" },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: "ID de notification requis" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Erreur lors de la suppression de la notification:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
