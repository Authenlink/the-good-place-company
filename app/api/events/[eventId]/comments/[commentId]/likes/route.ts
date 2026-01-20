import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { eventCommentLikes, eventComments, companies, users } from "@/lib/schema";
import { eq, and, isNull } from "drizzle-orm";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { createNotification } from "@/lib/notifications";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string; commentId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { commentId: commentIdStr } = await params;
    const commentId = parseInt(commentIdStr);
    if (isNaN(commentId)) {
      return NextResponse.json(
        { error: "ID de commentaire invalide" },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const includeList = searchParams.get("list") === "true";

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

    // Si on demande la liste complète des likes
    if (includeList) {
      const likesWithUsers = await db
        .select({
          id: eventCommentLikes.id,
          userId: eventCommentLikes.userId,
          companyId: eventCommentLikes.companyId,
          createdAt: eventCommentLikes.createdAt,
          userName: users.name,
          userImage: users.image,
          userGradient: users.backgroundGradient,
          companyName: companies.name,
          companyLogo: companies.logo,
          companyGradient: companies.backgroundGradient,
        })
        .from(eventCommentLikes)
        .leftJoin(users, eq(eventCommentLikes.userId, users.id))
        .leftJoin(companies, eq(eventCommentLikes.companyId, companies.id))
        .where(eq(eventCommentLikes.eventCommentId, commentId))
        .orderBy(eventCommentLikes.createdAt);

      return NextResponse.json({ likes: likesWithUsers });
    }

    // Compter le nombre total de likes
    const likeCount = await db
      .select()
      .from(eventCommentLikes)
      .where(eq(eventCommentLikes.eventCommentId, commentId));

    const count = likeCount.length;

    // Vérifier si l'utilisateur actuel a liké
    let isLiked = false;
    if (session.user.accountType === "user" && userId) {
      const userLike = await db
        .select()
        .from(eventCommentLikes)
        .where(
          and(
            eq(eventCommentLikes.eventCommentId, commentId),
            eq(eventCommentLikes.userId, userId),
            isNull(eventCommentLikes.companyId)
          )
        )
        .limit(1);
      isLiked = userLike.length > 0;
    } else if (session.user.accountType === "business" && companyId) {
      const companyLike = await db
        .select()
        .from(eventCommentLikes)
        .where(
          and(
            eq(eventCommentLikes.eventCommentId, commentId),
            eq(eventCommentLikes.companyId, companyId),
            isNull(eventCommentLikes.userId)
          )
        )
        .limit(1);
      isLiked = companyLike.length > 0;
    }

    return NextResponse.json({ count, isLiked });
  } catch (error) {
    console.error("Erreur lors de la récupération des likes:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string; commentId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { commentId: commentIdStr } = await params;
    const commentId = parseInt(commentIdStr);
    if (isNaN(commentId)) {
      return NextResponse.json(
        { error: "ID de commentaire invalide" },
        { status: 400 }
      );
    }

    // Vérifier que le commentaire existe
    const comment = await db
      .select({
        id: eventComments.id,
        userId: eventComments.userId,
        companyId: eventComments.companyId,
      })
      .from(eventComments)
      .where(eq(eventComments.id, commentId))
      .limit(1);

    if (comment.length === 0) {
      return NextResponse.json(
        { error: "Commentaire non trouvé" },
        { status: 404 }
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

    // Vérifier si le like existe déjà
    let existingLike;
    if (session.user.accountType === "user") {
      existingLike = await db
        .select()
        .from(eventCommentLikes)
        .where(
          and(
            eq(eventCommentLikes.eventCommentId, commentId),
            eq(eventCommentLikes.userId, userId),
            isNull(eventCommentLikes.companyId)
          )
        )
        .limit(1);
    } else if (session.user.accountType === "business" && companyId) {
      existingLike = await db
        .select()
        .from(eventCommentLikes)
        .where(
          and(
            eq(eventCommentLikes.eventCommentId, commentId),
            eq(eventCommentLikes.companyId, companyId),
            isNull(eventCommentLikes.userId)
          )
        )
        .limit(1);
    } else {
      // Business user without a company or unknown account type
      return NextResponse.json(
        { error: "Type de compte invalide ou entreprise non trouvée" },
        { status: 400 }
      );
    }

    if (existingLike.length > 0) {
      return NextResponse.json(
        { error: "Vous avez déjà liké ce commentaire" },
        { status: 400 }
      );
    }

    // Créer le like
    const newLike = (await db
      .insert(eventCommentLikes)
      .values({
        eventCommentId: commentId,
        userId: session.user.accountType === "user" ? userId : null,
        companyId: companyId,
      })
      .returning()) as any[];

    if (!newLike || newLike.length === 0) {
      return NextResponse.json(
        { error: "Erreur lors de l'ajout du like" },
        { status: 500 }
      );
    }

    // Créer une notification pour le créateur du commentaire
    const commentData = comment[0];
    if (commentData.userId && commentData.userId !== userId) {
      await createNotification({
        userId: commentData.userId,
        type: "event_comment_liked",
        relatedUserId: session.user.accountType === "user" ? userId : undefined,
        relatedCompanyId: companyId || undefined,
        relatedEventCommentId: commentId,
      });
    } else if (commentData.companyId) {
      const companyData = await db
        .select({ userId: companies.userId })
        .from(companies)
        .where(eq(companies.id, commentData.companyId))
        .limit(1);

      if (companyData.length > 0 && companyData[0].userId !== userId) {
        await createNotification({
          userId: companyData[0].userId,
          type: "event_comment_liked",
          relatedUserId: session.user.accountType === "user" ? userId : undefined,
          relatedCompanyId: companyId || undefined,
          relatedEventCommentId: commentId,
        });
      }
    }

    return NextResponse.json(newLike[0], { status: 201 });
  } catch (error: any) {
    console.error("Erreur lors de l'ajout du like:", error);
    // Si c'est une erreur de contrainte unique, le like existe déjà
    if (error?.code === "23505") {
      return NextResponse.json(
        { error: "Vous avez déjà liké ce commentaire" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string; commentId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { commentId: commentIdStr } = await params;
    const commentId = parseInt(commentIdStr);
    if (isNaN(commentId)) {
      return NextResponse.json(
        { error: "ID de commentaire invalide" },
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

    // Supprimer le like
    let deletedLike;
    if (session.user.accountType === "user") {
      deletedLike = await db
        .delete(eventCommentLikes)
        .where(
          and(
            eq(eventCommentLikes.eventCommentId, commentId),
            eq(eventCommentLikes.userId, userId),
            isNull(eventCommentLikes.companyId)
          )
        )
        .returning();
    } else if (session.user.accountType === "business" && companyId) {
      deletedLike = await db
        .delete(eventCommentLikes)
        .where(
          and(
            eq(eventCommentLikes.eventCommentId, commentId),
            eq(eventCommentLikes.companyId, companyId),
            isNull(eventCommentLikes.userId)
          )
        )
        .returning();
    } else {
      // Business user without a company or unknown account type
      return NextResponse.json(
        { error: "Type de compte invalide ou entreprise non trouvée" },
        { status: 400 }
      );
    }

    if (!deletedLike || deletedLike.length === 0) {
      return NextResponse.json(
        { error: "Like non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Like supprimé avec succès" });
  } catch (error) {
    console.error("Erreur lors de la suppression du like:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
