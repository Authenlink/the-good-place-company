import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { companies } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/app/api/auth/[...nextauth]/route";

export async function PUT(request: NextRequest) {
  try {
    console.log("🧪 API /api/company/update appelée");

    const body = await request.json();
    console.log("📦 Données reçues:", JSON.stringify(body, null, 2));

    const {
      name,
      description,
      logo,
      background,
      areaId,
      values,
      email,
      phone,
      address,
      website,
      founded,
      size,
    } = body;

    // Validation basique
    if (!name || name.trim() === "") {
      return NextResponse.json(
        { error: "Le nom de l'entreprise est requis" },
        { status: 400 }
      );
    }

    // Récupérer la session utilisateur
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    if (session.user.accountType !== "business") {
      return NextResponse.json(
        { error: "Accès réservé aux comptes entreprise" },
        { status: 403 }
      );
    }

    const userId = parseInt(session.user.id);
    console.log("👤 UserID récupéré:", userId);

    // Préparer les données pour la mise à jour
    const updateData = {
      name: name.trim(),
      description: description?.trim() || null,
      logo: logo || null,
      background: background || null,
      areaId: areaId ? parseInt(areaId) : null,
      values: values || [],
      email: email?.trim() || null,
      phone: phone?.trim() || null,
      address: address?.trim() || null,
      website: website?.trim() || null,
      founded: founded?.trim() || null,
      size: size || null,
      updatedAt: new Date(),
    };

    console.log("💾 Mise à jour de l'entreprise dans la base de données...");
    console.log(
      "📋 Données à mettre à jour:",
      JSON.stringify(updateData, null, 2)
    );

    // Mettre à jour l'entreprise dans la base de données
    const result = await db
      .update(companies)
      .set(updateData)
      .where(eq(companies.userId, userId))
      .returning();

    console.log(
      "📊 Résultat de la requête UPDATE:",
      JSON.stringify(result, null, 2)
    );

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Entreprise non trouvée ou non autorisée" },
        { status: 404 }
      );
    }

    const updatedCompany = result[0];
    console.log("✅ Entreprise mise à jour avec succès:", updatedCompany);

    return NextResponse.json({
      success: true,
      message: "Entreprise mise à jour avec succès",
      company: updatedCompany,
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'entreprise:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
