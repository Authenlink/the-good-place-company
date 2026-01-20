import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { eventComments, users, companies, eventCommentLikes, events } from "@/lib/schema";
import { eq, desc, and, isNull } from "drizzle-orm";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { createNotification } from "@/lib/notifications";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { eventId: eventIdStr } = await params;
    const eventId = parseInt(eventIdStr);
    if (isNaN(eventId)) {
      return NextResponse.json(
        { error: "ID d'événement invalide" },
        { status: 400 }
      );
    }

    const userId = parseInt(session.user.id);
    let companyId = null;

    if (session.user.accountType === "business") {
      const companyResult = await db
        .select({ id: companies.id })
        .from(companies)
        .where(eq(companies.userId, userId))
        .limit(1);

      if (companyResult.length > 0) {
        companyId = companyResult[0].id;
      }
    }

    // Fonction helper pour récupérer les likes d'un commentaire
    const getCommentLikes = async (commentId: number) => {
      const likes = await db
        .select()
        .from(eventCommentLikes)
        .where(eq(eventCommentLikes.eventCommentId, commentId));

      const count = likes.length;

      let isLiked = false;
      if (session.user.accountType === "user" && userId) {
        isLiked = likes.some(
          (like) => like.userId === userId && like.companyId === null
        );
      } else if (session.user.accountType === "business" && companyId) {
        isLiked = likes.some(
          (like) => like.companyId === companyId && like.userId === null
        );
      }

      return { count, isLiked };
    };

    // Récupérer tous les commentaires de l'événement (commentaires principaux uniquement)
    const eventCommentsList = await db
      .select({
        id: eventComments.id,
        content: eventComments.content,
        createdAt: eventComments.createdAt,
        updatedAt: eventComments.updatedAt,
        userId: eventComments.userId,
        companyId: eventComments.companyId,
        parentId: eventComments.parentId,
        userName: users.name,
        userImage: users.image,
        userGradient: users.backgroundGradient,
        companyName: companies.name,
        companyLogo: companies.logo,
        companyGradient: companies.backgroundGradient,
      })
      .from(eventComments)
      .leftJoin(users, eq(eventComments.userId, users.id))
      .leftJoin(companies, eq(eventComments.companyId, companies.id))
      .where(and(eq(eventComments.eventId, eventId), isNull(eventComments.parentId)))
      .orderBy(desc(eventComments.createdAt));

    // Pour chaque commentaire, récupérer les réponses et les likes
    const commentsWithReplies = await Promise.all(
      eventCommentsList.map(async (comment) => {
        const replies = await db
          .select({
            id: eventComments.id,
            content: eventComments.content,
            createdAt: eventComments.createdAt,
            updatedAt: eventComments.updatedAt,
            userId: eventComments.userId,
            companyId: eventComments.companyId,
            parentId: eventComments.parentId,
            userName: users.name,
            userImage: users.image,
            userGradient: users.backgroundGradient,
            companyName: companies.name,
            companyLogo: companies.logo,
            companyGradient: companies.backgroundGradient,
          })
          .from(eventComments)
          .leftJoin(users, eq(eventComments.userId, users.id))
          .leftJoin(companies, eq(eventComments.companyId, companies.id))
          .where(eq(eventComments.parentId, comment.id))
          .orderBy(eventComments.createdAt);

        // Récupérer les likes pour le commentaire principal et les réponses
        const commentLikesData = await getCommentLikes(comment.id);
        const repliesWithLikes = await Promise.all(
          replies.map(async (reply) => {
            const replyLikesData = await getCommentLikes(reply.id);
            return {
              ...reply,
              likes: replyLikesData,
            };
          })
        );

        return {
          ...comment,
          replies: repliesWithLikes,
          likes: commentLikesData,
        };
      })
    );

    return NextResponse.json(commentsWithReplies);
  } catch (error) {
    console.error("Erreur lors de la récupération des commentaires:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { eventId: eventIdStr } = await params;
    const eventId = parseInt(eventIdStr);
    if (isNaN(eventId)) {
      return NextResponse.json(
        { error: "ID d'événement invalide" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { content, parentId } = body;

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Le contenu du commentaire est requis" },
        { status: 400 }
      );
    }

    const userId = parseInt(session.user.id);

    let companyId = null;
    if (session.user.accountType === "business") {
      // Récupérer l'ID de l'entreprise
      const companyResult = await db
        .select({ id: companies.id })
        .from(companies)
        .where(eq(companies.userId, userId))
        .limit(1);

      if (companyResult.length > 0) {
        companyId = companyResult[0].id;
      }
    }

    // Récupérer l'événement pour notifier l'entreprise propriétaire
    const event = await db
      .select({
        id: events.id,
        companyId: events.companyId,
      })
      .from(events)
      .where(eq(events.id, eventId))
      .limit(1);

    // Créer le commentaire
    const newComment = (await db
      .insert(eventComments)
      .values({
        content: content.trim(),
        eventId,
        userId: session.user.accountType === "user" ? userId : null,
        companyId: companyId,
        parentId: parentId || null,
      })
      .returning()) as any[];

    if (!newComment || newComment.length === 0) {
      return NextResponse.json(
        { error: "Erreur lors de la création du commentaire" },
        { status: 500 }
      );
    }

    // Créer une notification pour l'entreprise propriétaire de l'événement
    if (event.length > 0 && event[0].companyId) {
      const companyData = await db
        .select({ userId: companies.userId })
        .from(companies)
        .where(eq(companies.id, event[0].companyId))
        .limit(1);

      if (companyData.length > 0 && companyData[0].userId !== userId) {
        await createNotification({
          userId: companyData[0].userId,
          type: "event_commented",
          relatedUserId: session.user.accountType === "user" ? userId : undefined,
          relatedCompanyId: companyId || undefined,
          relatedEventId: eventId,
          relatedEventCommentId: newComment[0].id,
        });
      }
    }

    return NextResponse.json(newComment[0], { status: 201 });
  } catch (error) {
    console.error("Erreur lors de la création du commentaire:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
