import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { events } from "@/lib/schema";
import { eq, and, isNotNull } from "drizzle-orm";
import { auth } from "@/app/api/auth/[...nextauth]/route";

// GET - Récupérer la liste des villes uniques depuis les événements publiés
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search"); // Recherche de ville (optionnel)

    // Récupérer les villes uniques depuis les événements publiés
    const query = db
      .selectDistinct({
        city: events.city,
      })
      .from(events)
      .where(
        and(
          eq(events.status, "published"),
          isNotNull(events.city)
        )
      );

    // Si une recherche est fournie, filtrer les villes
    // Note: Drizzle ne supporte pas directement LIKE avec selectDistinct,
    // donc on récupère toutes les villes et on filtre côté serveur
    const citiesResult = await query;

    // Extraire les villes uniques et les trier
    let cities = citiesResult
      .map((row) => row.city)
      .filter((city): city is string => city !== null && city.trim() !== "")
      .sort();

    // Filtrer par recherche si fournie (insensible à la casse)
    if (search) {
      const searchLower = search.toLowerCase();
      cities = cities.filter((city) =>
        city.toLowerCase().includes(searchLower)
      );
    }

    return NextResponse.json({ cities });
  } catch (error) {
    console.error("Erreur lors de la récupération des villes:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
