import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { postLikes, posts, companies } from "@/lib/schema";
import { eq, and, isNull } from "drizzle-orm";
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

    // Compter le nombre total de likes
    const likeCount = await db
      .select()
      .from(postLikes)
      .where(eq(postLikes.postId, postId));

    const count = likeCount.length;

    // Vérifier si l'utilisateur actuel a liké
    let isLiked = false;
    if (session.user.accountType === "user" && userId) {
      const userLike = await db
        .select()
        .from(postLikes)
        .where(
          and(
            eq(postLikes.postId, postId),
            eq(postLikes.userId, userId),
            isNull(postLikes.companyId)
          )
        )
        .limit(1);
      isLiked = userLike.length > 0;
    } else if (session.user.accountType === "business" && companyId) {
      const companyLike = await db
        .select()
        .from(postLikes)
        .where(
          and(
            eq(postLikes.postId, postId),
            eq(postLikes.companyId, companyId),
            isNull(postLikes.userId)
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

    // Vérifier que le post existe
    const post = await db
      .select({
        id: posts.id,
        userId: posts.userId,
        companyId: posts.companyId,
      })
      .from(posts)
      .where(eq(posts.id, postId))
      .limit(1);

    if (post.length === 0) {
      return NextResponse.json(
        { error: "Post non trouvé" },
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
        .from(postLikes)
        .where(
          and(
            eq(postLikes.postId, postId),
            eq(postLikes.userId, userId),
            isNull(postLikes.companyId)
          )
        )
        .limit(1);
    } else if (session.user.accountType === "business" && companyId) {
      existingLike = await db
        .select()
        .from(postLikes)
        .where(
          and(
            eq(postLikes.postId, postId),
            eq(postLikes.companyId, companyId),
            isNull(postLikes.userId)
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
        { error: "Vous avez déjà liké ce post" },
        { status: 400 }
      );
    }

    // Créer le like
    const newLike = (await db
      .insert(postLikes)
      .values({
        postId,
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

    // Créer une notification pour le créateur du post
    const postData = post[0];
    if (postData.userId && postData.userId !== userId) {
      // Ne pas notifier si l'utilisateur like son propre post
      await createNotification({
        userId: postData.userId,
        type: "post_liked",
        relatedUserId: session.user.accountType === "user" ? userId : undefined,
        relatedCompanyId: companyId || undefined,
        relatedPostId: postId,
      });
    } else if (postData.companyId) {
      // Notifier l'entreprise propriétaire du post
      const companyData = await db
        .select({ userId: companies.userId })
        .from(companies)
        .where(eq(companies.id, postData.companyId))
        .limit(1);

      if (companyData.length > 0 && companyData[0].userId !== userId) {
        await createNotification({
          userId: companyData[0].userId,
          type: "post_liked",
          relatedUserId: session.user.accountType === "user" ? userId : undefined,
          relatedCompanyId: companyId || undefined,
          relatedPostId: postId,
        });
      }
    }

    return NextResponse.json(newLike[0], { status: 201 });
  } catch (error: any) {
    console.error("Erreur lors de l'ajout du like:", error);
    // Si c'est une erreur de contrainte unique, le like existe déjà
    if (error?.code === "23505") {
      return NextResponse.json(
        { error: "Vous avez déjà liké ce post" },
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

    // Supprimer le like
    let deletedLike;
    if (session.user.accountType === "user") {
      deletedLike = await db
        .delete(postLikes)
        .where(
          and(
            eq(postLikes.postId, postId),
            eq(postLikes.userId, userId),
            isNull(postLikes.companyId)
          )
        )
        .returning();
    } else if (session.user.accountType === "business" && companyId) {
      deletedLike = await db
        .delete(postLikes)
        .where(
          and(
            eq(postLikes.postId, postId),
            eq(postLikes.companyId, companyId),
            isNull(postLikes.userId)
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
