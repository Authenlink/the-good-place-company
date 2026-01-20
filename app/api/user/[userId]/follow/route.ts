import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { userFollows, users } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/app/api/auth/[...nextauth]/route";
import { createNotification } from "@/lib/notifications";

// GET - Vérifier si l'user connecté suit cet user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ isFollowing: false });
    }

    if (session.user.accountType !== "user") {
      return NextResponse.json({ isFollowing: false });
    }

    const { userId: userIdStr } = await params;
    const targetUserId = parseInt(userIdStr);
    if (isNaN(targetUserId)) {
      return NextResponse.json(
        { error: "ID utilisateur invalide" },
        { status: 400 }
      );
    }

    const currentUserId = parseInt(session.user.id);

    // Ne pas permettre de se suivre soi-même
    if (currentUserId === targetUserId) {
      return NextResponse.json({ isFollowing: false });
    }

    // Vérifier si l'user suit déjà cet user
    const existingFollow = await db
      .select()
      .from(userFollows)
      .where(
        and(
          eq(userFollows.followerId, currentUserId),
          eq(userFollows.followingId, targetUserId)
        )
      )
      .limit(1);

    return NextResponse.json({
      isFollowing: existingFollow.length > 0,
    });
  } catch (error) {
    console.error("Erreur lors de la vérification du follow:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// POST - Suivre un user
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (session.user.accountType !== "user") {
      return NextResponse.json(
        { error: "Seuls les utilisateurs peuvent suivre d'autres utilisateurs" },
        { status: 403 }
      );
    }

    const { userId: userIdStr } = await params;
    const targetUserId = parseInt(userIdStr);
    if (isNaN(targetUserId)) {
      return NextResponse.json(
        { error: "ID utilisateur invalide" },
        { status: 400 }
      );
    }

    const currentUserId = parseInt(session.user.id);

    // Ne pas permettre de se suivre soi-même
    if (currentUserId === targetUserId) {
      return NextResponse.json(
        { error: "Vous ne pouvez pas vous suivre vous-même" },
        { status: 400 }
      );
    }

    // Vérifier que l'user existe
    const targetUser = await db
      .select()
      .from(users)
      .where(eq(users.id, targetUserId))
      .limit(1);

    if (targetUser.length === 0) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    // Vérifier si l'user suit déjà cet user
    const existingFollow = await db
      .select()
      .from(userFollows)
      .where(
        and(
          eq(userFollows.followerId, currentUserId),
          eq(userFollows.followingId, targetUserId)
        )
      )
      .limit(1);

    if (existingFollow.length > 0) {
      return NextResponse.json(
        { error: "Vous suivez déjà cet utilisateur" },
        { status: 400 }
      );
    }

    // Créer le follow
    await db.insert(userFollows).values({
      followerId: currentUserId,
      followingId: targetUserId,
    });

    // Créer une notification pour l'utilisateur suivi
    await createNotification({
      userId: targetUserId,
      type: "user_followed",
      relatedUserId: currentUserId,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Erreur lors du follow:", error);
    // Gérer l'erreur de contrainte unique
    if (error?.code === "23505") {
      return NextResponse.json(
        { error: "Vous suivez déjà cet utilisateur" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// DELETE - Ne plus suivre un user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (session.user.accountType !== "user") {
      return NextResponse.json(
        { error: "Seuls les utilisateurs peuvent suivre d'autres utilisateurs" },
        { status: 403 }
      );
    }

    const { userId: userIdStr } = await params;
    const targetUserId = parseInt(userIdStr);
    if (isNaN(targetUserId)) {
      return NextResponse.json(
        { error: "ID utilisateur invalide" },
        { status: 400 }
      );
    }

    const currentUserId = parseInt(session.user.id);

    // Supprimer le follow
    const result = await db
      .delete(userFollows)
      .where(
        and(
          eq(userFollows.followerId, currentUserId),
          eq(userFollows.followingId, targetUserId)
        )
      )
      .returning();

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Vous ne suivez pas cet utilisateur" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur lors de l'unfollow:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
