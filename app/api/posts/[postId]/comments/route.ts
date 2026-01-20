import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { comments, users, companies, commentLikes, posts } from "@/lib/schema";
import { eq, desc, and, isNull } from "drizzle-orm";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { createNotification } from "@/lib/notifications";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { postId: postIdStr } = await params;
    const postId = parseInt(postIdStr);
    if (isNaN(postId)) {
      return NextResponse.json(
        { error: "ID de post invalide" },
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
        .from(commentLikes)
        .where(eq(commentLikes.commentId, commentId));

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

    // Récupérer tous les commentaires du post (commentaires principaux uniquement)
    const postComments = await db
      .select({
        id: comments.id,
        content: comments.content,
        createdAt: comments.createdAt,
        updatedAt: comments.updatedAt,
        userId: comments.userId,
        companyId: comments.companyId,
        parentId: comments.parentId,
        userName: users.name,
        userImage: users.image,
        userGradient: users.backgroundGradient,
        companyName: companies.name,
        companyLogo: companies.logo,
        companyGradient: companies.backgroundGradient,
      })
      .from(comments)
      .leftJoin(users, eq(comments.userId, users.id))
      .leftJoin(companies, eq(comments.companyId, companies.id))
      .where(and(eq(comments.postId, postId), isNull(comments.parentId)))
      .orderBy(desc(comments.createdAt));

    // Pour chaque commentaire, récupérer les réponses et les likes
    const commentsWithReplies = await Promise.all(
      postComments.map(async (comment) => {
        const replies = await db
          .select({
            id: comments.id,
            content: comments.content,
            createdAt: comments.createdAt,
            updatedAt: comments.updatedAt,
            userId: comments.userId,
            companyId: comments.companyId,
            parentId: comments.parentId,
            userName: users.name,
            userImage: users.image,
            userGradient: users.backgroundGradient,
            companyName: companies.name,
            companyLogo: companies.logo,
            companyGradient: companies.backgroundGradient,
          })
          .from(comments)
          .leftJoin(users, eq(comments.userId, users.id))
          .leftJoin(companies, eq(comments.companyId, companies.id))
          .where(eq(comments.parentId, comment.id))
          .orderBy(comments.createdAt);

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
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { postId: postIdStr } = await params;
    const postId = parseInt(postIdStr);
    if (isNaN(postId)) {
      return NextResponse.json(
        { error: "ID de post invalide" },
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

    // Récupérer le post pour notifier son créateur
    const post = await db
      .select({
        id: posts.id,
        userId: posts.userId,
        companyId: posts.companyId,
      })
      .from(posts)
      .where(eq(posts.id, postId))
      .limit(1);

    // Créer le commentaire
    const newComment = (await db
      .insert(comments)
      .values({
        content: content.trim(),
        postId,
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

    // Créer une notification pour le créateur du post (si ce n'est pas le même utilisateur)
    if (post.length > 0) {
      const postData = post[0];
      if (postData.userId && postData.userId !== userId) {
        await createNotification({
          userId: postData.userId,
          type: "post_commented",
          relatedUserId: session.user.accountType === "user" ? userId : undefined,
          relatedCompanyId: companyId || undefined,
          relatedPostId: postId,
          relatedCommentId: newComment[0].id,
        });
      } else if (postData.companyId) {
        const companyData = await db
          .select({ userId: companies.userId })
          .from(companies)
          .where(eq(companies.id, postData.companyId))
          .limit(1);

        if (companyData.length > 0 && companyData[0].userId !== userId) {
          await createNotification({
            userId: companyData[0].userId,
            type: "post_commented",
            relatedUserId: session.user.accountType === "user" ? userId : undefined,
            relatedCompanyId: companyId || undefined,
            relatedPostId: postId,
            relatedCommentId: newComment[0].id,
          });
        }
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
