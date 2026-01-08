import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { projectTags } from "@/lib/schema";
import { PROJECT_TAGS } from "@/lib/schema";

// GET - Liste des tags de projets prédéfinis
export async function GET() {
  try {
    // Essayer de récupérer depuis la base de données
    const tagsFromDb = await db.select().from(projectTags);

    if (tagsFromDb.length > 0) {
      return NextResponse.json(tagsFromDb);
    }

    // Fallback sur les constantes si la table est vide
    const tagsFromConstants = Object.entries(PROJECT_TAGS).map(
      ([key, value]) => ({
        key,
        name: value.name,
        color: value.color,
      })
    );

    return NextResponse.json(tagsFromConstants);
  } catch (error) {
    console.error("Erreur lors de la récupération des tags:", error);

    // En cas d'erreur (table non créée), retourner les constantes
    const tagsFromConstants = Object.entries(PROJECT_TAGS).map(
      ([key, value]) => ({
        key,
        name: value.name,
        color: value.color,
      })
    );

    return NextResponse.json(tagsFromConstants);
  }
}
