import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { companies, posts } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { neon } from "@neondatabase/serverless";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

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

    // Pour les business users, on filtre sur leur entreprise
    // Pour les autres types d'utilisateurs, on ne retourne rien (ou on peut changer cette logique)

    // Utiliser une requête SQL brute qui évite les colonnes manquantes
    const sql = neon(process.env.DATABASE_URL!);
    // Essayer de récupérer company_id si la colonne existe
    let allPosts;
    try {
      allPosts = await sql`
        SELECT
          p.id,
          p.content,
          p.company_id,
          p.images,
          p.created_at,
          p.user_id,
          u.name as user_name,
          u.image as user_image,
          c.name as company_name,
          c.logo as company_logo
        FROM posts p
        LEFT JOIN users u ON p.user_id = u.id
        LEFT JOIN companies c ON p.company_id = c.id
        ${companyId ? sql`WHERE p.company_id = ${companyId}` : sql``}
        ORDER BY p.created_at DESC
      `;
    } catch (error) {
      // Si certaines colonnes n'existent pas, récupérer sans elles
      console.log(
        "⚠️ Colonnes manquantes détectées:",
        error instanceof Error ? error.message : String(error)
      );
      try {
        // Essayer avec company_id seulement
        allPosts = await sql`
          SELECT
            p.id,
            p.content,
            p.company_id,
            p.created_at,
            p.user_id,
            u.name as user_name,
            u.image as user_image,
            c.name as company_name,
            c.logo as company_logo
          FROM posts p
          LEFT JOIN users u ON p.user_id = u.id
          LEFT JOIN companies c ON p.company_id = c.id
          ${companyId ? sql`WHERE p.company_id = ${companyId}` : sql``}
          ORDER BY p.created_at DESC
        `;
      } catch (error2) {
        // Récupération de base
        allPosts = await sql`
          SELECT
            p.id,
            p.content,
            p.created_at,
            p.user_id,
            u.name as user_name,
            u.image as user_image,
            c.name as company_name,
            c.logo as company_logo
          FROM posts p
          LEFT JOIN users u ON p.user_id = u.id
          LEFT JOIN companies c ON p.company_id = c.id
          ${companyId ? sql`WHERE p.company_id = ${companyId}` : sql``}
          ORDER BY p.created_at DESC
        `;
      }
    }

    // Transformer les résultats pour correspondre au format attendu
    const transformedPosts = allPosts.map((post: any) => {
      const createdDate = post.created_at
        ? new Date(post.created_at)
        : new Date();

      // Déterminer si c'est un post d'entreprise ou d'utilisateur
      const isCompanyPost =
        post.company_id !== null && post.company_id !== undefined;
      const displayName = isCompanyPost ? post.company_name : post.user_name;
      const displayImage = isCompanyPost ? post.company_logo : post.user_image;

      return {
        ...post,
        images: post.images || [], // Utiliser les images de la DB ou tableau vide
        createdAt: createdDate.toISOString(), // Convertir en ISO string valide
        updatedAt: createdDate.toISOString(), // Utiliser created_at comme fallback
        userId: post.user_id,
        companyId: post.company_id || null,
        // Ajouter les informations d'affichage
        displayName,
        displayImage,
        isCompanyPost,
      };
    });

    return NextResponse.json(transformedPosts);
  } catch (error) {
    console.error("Erreur lors de la récupération des posts:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const { content, images } = body;

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Le contenu du post est requis" },
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

    // Créer le post en utilisant une requête SQL brute temporaire
    const sql = neon(process.env.DATABASE_URL!);

    // Essayer d'insérer avec toutes les colonnes si elles existent
    let insertResult;
    try {
      insertResult = await sql`
        INSERT INTO posts (content, user_id, company_id, images, created_at)
        VALUES (${content.trim()}, ${userId}, ${companyId}, ${JSON.stringify(
        images || []
      )}, NOW())
        RETURNING id, content, user_id, company_id, images, created_at
      `;
    } catch (error) {
      // Si certaines colonnes n'existent pas, essayer avec les colonnes de base
      console.log(
        "⚠️ Certaines colonnes manquent, insertion avec colonnes de base:",
        error instanceof Error ? error.message : String(error)
      );
      try {
        // Essayer avec company_id et images
        insertResult = await sql`
          INSERT INTO posts (content, user_id, company_id, images, created_at)
          VALUES (${content.trim()}, ${userId}, ${companyId}, ${JSON.stringify(
          images || []
        )}, NOW())
          RETURNING id, content, user_id, company_id, images, created_at
        `;
      } catch (error2) {
        try {
          // Essayer avec seulement company_id
          insertResult = await sql`
            INSERT INTO posts (content, user_id, company_id, created_at)
            VALUES (${content.trim()}, ${userId}, ${companyId}, NOW())
            RETURNING id, content, user_id, company_id, created_at
          `;
        } catch (error3) {
          // Dernière tentative avec seulement les colonnes de base
          insertResult = await sql`
            INSERT INTO posts (content, user_id, created_at)
            VALUES (${content.trim()}, ${userId}, NOW())
            RETURNING id, content, user_id, created_at
          `;
        }
      }
    }

    const newPost = insertResult[0];

    return NextResponse.json(
      {
        ...newPost,
        images: newPost.images || images || [], // Utiliser les images de la DB ou celles passées
        userId: newPost.user_id,
        updatedAt: newPost.created_at,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erreur lors de la création du post:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer un post
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const postId = searchParams.get("id");

    if (!postId) {
      return NextResponse.json({ error: "ID du post requis" }, { status: 400 });
    }

    // Vérifier que l'utilisateur est propriétaire du post (via son entreprise)
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

    if (!companyId) {
      return NextResponse.json(
        { error: "Entreprise non trouvée" },
        { status: 404 }
      );
    }

    // Vérifier que le post appartient à l'entreprise
    const postCheck = await db
      .select()
      .from(posts)
      .where(eq(posts.id, parseInt(postId)))
      .limit(1);

    if (postCheck.length === 0 || postCheck[0].companyId !== companyId) {
      return NextResponse.json(
        { error: "Post non trouvé ou accès non autorisé" },
        { status: 404 }
      );
    }

    // Supprimer le post
    await db.delete(posts).where(eq(posts.id, parseInt(postId)));

    return NextResponse.json({ message: "Post supprimé avec succès" });
  } catch (error) {
    console.error("Erreur lors de la suppression du post:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// PUT - Modifier un post
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const postId = searchParams.get("id");

    if (!postId) {
      return NextResponse.json({ error: "ID du post requis" }, { status: 400 });
    }

    const body = await request.json();
    const { content, images } = body;

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Le contenu du post est requis" },
        { status: 400 }
      );
    }

    // Vérifier que l'utilisateur est propriétaire du post (via son entreprise)
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

    if (!companyId) {
      return NextResponse.json(
        { error: "Entreprise non trouvée" },
        { status: 404 }
      );
    }

    // Vérifier que le post appartient à l'entreprise
    const postCheck = await db
      .select()
      .from(posts)
      .where(eq(posts.id, parseInt(postId)))
      .limit(1);

    if (postCheck.length === 0 || postCheck[0].companyId !== companyId) {
      return NextResponse.json(
        { error: "Post non trouvé ou accès non autorisé" },
        { status: 404 }
      );
    }

    // Mettre à jour le post
    const updatedPost = await db
      .update(posts)
      .set({
        content: content.trim(),
        images: images || [],
        updatedAt: new Date(),
      })
      .where(eq(posts.id, parseInt(postId)))
      .returning();

    return NextResponse.json(updatedPost[0]);
  } catch (error) {
    console.error("Erreur lors de la modification du post:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
