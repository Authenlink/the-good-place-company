import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { comments, users, companies } from "@/lib/schema";
import { eq, desc, and, isNull } from "drizzle-orm";
import { auth } from "@/app/api/auth/[...nextauth]/route";

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
        companyName: companies.name,
        companyLogo: companies.logo,
      })
      .from(comments)
      .leftJoin(users, eq(comments.userId, users.id))
      .leftJoin(companies, eq(comments.companyId, companies.id))
      .where(and(eq(comments.postId, postId), isNull(comments.parentId)))
      .orderBy(desc(comments.createdAt));

    // Pour chaque commentaire, récupérer les réponses
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
            companyName: companies.name,
            companyLogo: companies.logo,
          })
          .from(comments)
          .leftJoin(users, eq(comments.userId, users.id))
          .leftJoin(companies, eq(comments.companyId, companies.id))
          .where(eq(comments.parentId, comment.id))
          .orderBy(comments.createdAt);

        return {
          ...comment,
          replies,
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

    return NextResponse.json(newComment[0], { status: 201 });
  } catch (error) {
    console.error("Erreur lors de la création du commentaire:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
