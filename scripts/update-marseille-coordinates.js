import { db } from "../lib/db";
import { companies } from "../lib/schema";
import { eq } from "drizzle-orm";

async function updateMarseilleCoordinates() {
  try {
    console.log("🗺️ Mise à jour des coordonnées GPS pour Marseille...\n");

    // Coordonnées du centre de Marseille
    const marseilleCoords = {
      lat: 43.2965,
      lng: 5.3698,
    };

    // Trouver toutes les entreprises de Marseille sans coordonnées
    const marseilleCompanies = await db
      .select({
        id: companies.id,
        name: companies.name,
        address: companies.address,
        coordinates: companies.coordinates,
      })
      .from(companies)
      .where(eq(companies.city, "Marseille"));

    console.log(
      `📍 ${marseilleCompanies.length} entreprise(s) trouvée(s) à Marseille:`
    );

    for (const company of marseilleCompanies) {
      console.log(
        `   - ${company.name}: ${company.address || "Pas d'adresse"}`
      );

      if (!company.coordinates) {
        // Mettre à jour avec les coordonnées de Marseille centre
        await db
          .update(companies)
          .set({
            coordinates: marseilleCoords,
          })
          .where(eq(companies.id, company.id));

        console.log(
          `   ✅ Coordonnées ajoutées: [${marseilleCoords.lat}, ${marseilleCoords.lng}]`
        );
      } else {
        console.log(
          `   ℹ️ Coordonnées déjà présentes: [${company.coordinates.lat}, ${company.coordinates.lng}]`
        );
      }
    }

    console.log(
      "\n🎯 Toutes les entreprises de Marseille ont maintenant des coordonnées GPS !"
    );
  } catch (error) {
    console.error("❌ Erreur lors de la mise à jour:", error);
  }
}

updateMarseilleCoordinates().then(() => {
  console.log("✅ Script terminé");
  process.exit(0);
});
