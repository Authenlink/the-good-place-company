import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { companies } from "@/lib/schema";
import { eq, sql } from "drizzle-orm";

export async function GET() {
  try {
    console.log("🔍 Vérification des coordonnées GPS des entreprises...\n");

    // Récupérer toutes les entreprises avec leurs coordonnées
    const allCompanies = await db
      .select({
        id: companies.id,
        name: companies.name,
        address: companies.address,
        city: companies.city,
        coordinates: companies.coordinates,
      })
      .from(companies);

    console.log(`📊 Total entreprises: ${allCompanies.length}`);

    // Statistiques
    const withCoordinates = allCompanies.filter((c) => c.coordinates);
    const withoutCoordinates = allCompanies.filter((c) => !c.coordinates);

    console.log(`✅ Avec coordonnées: ${withCoordinates.length}`);
    console.log(`❌ Sans coordonnées: ${withoutCoordinates.length}`);

    // Afficher les 5 premières entreprises sans coordonnées
    console.log("\n❌ Entreprises sans coordonnées (5 premiers):");
    withoutCoordinates.slice(0, 5).forEach((company) => {
      console.log(
        `- ${company.name} (${company.city}): ${
          company.address || "Adresse inconnue"
        }`
      );
    });

    // Afficher les 5 premières entreprises avec coordonnées
    console.log("\n✅ Entreprises avec coordonnées (5 premiers):");
    withCoordinates.slice(0, 5).forEach((company) => {
      console.log(
        `- ${company.name} (${company.city}): Lat ${company.coordinates?.lat}, Lng ${company.coordinates?.lng}`
      );
    });

    return NextResponse.json({
      total: allCompanies.length,
      withCoordinates: withCoordinates.length,
      withoutCoordinates: withoutCoordinates.length,
      companies: allCompanies.slice(0, 10), // Limiter pour la réponse JSON
    });
  } catch (error) {
    console.error("❌ Erreur:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    console.log(
      "🗺️ Ajout de coordonnées GPS de base aux entreprises sans coordonnées...\n"
    );

    // Coordonnées par défaut pour les villes principales
    const defaultCoordinates: { [key: string]: { lat: number; lng: number } } =
      {
        Marseille: { lat: 43.2965, lng: 5.3698 },
        Paris: { lat: 48.8566, lng: 2.3522 },
        Lyon: { lat: 45.764, lng: 4.8357 },
        Toulouse: { lat: 43.6047, lng: 1.4442 },
        Nice: { lat: 43.7102, lng: 7.262 },
        Nantes: { lat: 47.2184, lng: -1.5536 },
        Strasbourg: { lat: 48.5734, lng: 7.7521 },
        Montpellier: { lat: 43.6108, lng: 3.8767 },
        Bordeaux: { lat: 44.8378, lng: -0.5792 },
        Lille: { lat: 50.6292, lng: 3.0573 },
      };

    // Récupérer les entreprises sans coordonnées
    const companiesWithoutCoordinates = await db
      .select({
        id: companies.id,
        name: companies.name,
        city: companies.city,
      })
      .from(companies)
      .where(sql`${companies.coordinates} IS NULL`);

    console.log(
      `📍 ${companiesWithoutCoordinates.length} entreprise(s) sans coordonnées trouvée(s)`
    );

    let updated = 0;
    let skipped = 0;

    for (const company of companiesWithoutCoordinates) {
      const coords = company.city ? defaultCoordinates[company.city] : null;

      if (coords) {
        await db
          .update(companies)
          .set({ coordinates: coords })
          .where(eq(companies.id, company.id));

        console.log(
          `✅ ${company.name} (${company.city}): coordonnées ajoutées`
        );
        updated++;
      } else {
        console.log(
          `⚠️ ${company.name} (${company.city}): ville non reconnue, coordonnées ignorées`
        );
        skipped++;
      }
    }

    return NextResponse.json({
      message: "Mise à jour terminée",
      updated,
      skipped,
      totalProcessed: companiesWithoutCoordinates.length,
    });
  } catch (error) {
    console.error("❌ Erreur:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
