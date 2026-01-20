import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { notifications } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/app/api/auth/[...nextauth]/route";

// POST - Marquer toutes les notifications comme lues
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const userId = parseInt(session.user.id);

    // Marquer toutes les notifications non lues comme lues
    const result = await db
      .update(notifications)
      .set({ read: true })
      .where(and(eq(notifications.userId, userId), eq(notifications.read, false)))
      .returning();

    return NextResponse.json({
      success: true,
      count: result.length,
    });
  } catch (error) {
    console.error("Erreur lors du marquage des notifications:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
