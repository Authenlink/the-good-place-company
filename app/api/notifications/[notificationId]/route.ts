import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { notifications } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/app/api/auth/[...nextauth]/route";

// PATCH - Marquer une notification spécifique comme lue
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ notificationId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    const { notificationId } = await params;
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
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la notification:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer une notification spécifique
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ notificationId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    const { notificationId } = await params;
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
  } catch (error) {
    console.error("Erreur lors de la suppression de la notification:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
