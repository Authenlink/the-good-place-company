import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { notifications } from "@/lib/schema";
import { eq, and, sql } from "drizzle-orm";
import { auth } from "@/app/api/auth/[...nextauth]/route";

// GET - Récupérer le nombre de notifications non lues
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ count: 0 });
    }

    const userId = parseInt(session.user.id);

    // Compter les notifications non lues
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.read, false)));

    const count = Number(result[0]?.count || 0);

    return NextResponse.json({ count });
  } catch (error) {
    console.error("Erreur lors du comptage des notifications:", error);
    return NextResponse.json({ count: 0 });
  }
}
