import { db } from "../lib/db.js";
import { companies } from "../lib/schema.js";
import { eq } from "drizzle-orm";

async function fixCoordinates() {
  try {
    console.log("🗺️ Vérification et ajout de coordonnées GPS...\n");

    // Coordonnées par défaut pour les villes principales
    const defaultCoordinates = {
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

    // Récupérer toutes les entreprises
    const allCompanies = await db
      .select({
        id: companies.id,
        name: companies.name,
        city: companies.city,
        coordinates: companies.coordinates,
      })
      .from(companies);

    console.log(`📊 Total entreprises: ${allCompanies.length}`);

    let updated = 0;
    let skipped = 0;
    let alreadyHave = 0;

    for (const company of allCompanies) {
      if (company.coordinates) {
        console.log(
          `✅ ${company.name} (${company.city}): coordonnées déjà présentes`
        );
        alreadyHave++;
        continue;
      }

      const coords = defaultCoordinates[company.city];

      if (coords) {
        await db
          .update(companies)
          .set({ coordinates: coords })
          .where(eq(companies.id, company.id));

        console.log(
          `✅ ${company.name} (${company.city}): coordonnées ajoutées [${coords.lat}, ${coords.lng}]`
        );
        updated++;
      } else {
        console.log(
          `⚠️ ${company.name} (${company.city}): ville non reconnue, coordonnées ignorées`
        );
        skipped++;
      }
    }

    console.log("\n📈 Résumé:");
    console.log(`- Entreprises avec coordonnées: ${alreadyHave}`);
    console.log(`- Coordonnées ajoutées: ${updated}`);
    console.log(`- Villes non reconnues: ${skipped}`);
    console.log(`- Total traité: ${allCompanies.length}`);
  } catch (error) {
    console.error("❌ Erreur:", error);
  } finally {
    process.exit(0);
  }
}

fixCoordinates();
