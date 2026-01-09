import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { companies } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  try {
    const resolvedParams = await params;
    const companyId = parseInt(resolvedParams.companyId);
    const body = await request.json();

    if (
      !body.coordinates ||
      typeof body.coordinates.lat !== "number" ||
      typeof body.coordinates.lng !== "number"
    ) {
      return NextResponse.json(
        { error: "Coordonnées invalides" },
        { status: 400 }
      );
    }

    // Mettre à jour les coordonnées
    await db
      .update(companies)
      .set({
        coordinates: {
          lat: body.coordinates.lat,
          lng: body.coordinates.lng,
        },
      })
      .where(eq(companies.id, companyId));

    return NextResponse.json({
      success: true,
      message: "Coordonnées mises à jour",
    });
  } catch (error) {
    console.error("Erreur mise à jour coordonnées:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
