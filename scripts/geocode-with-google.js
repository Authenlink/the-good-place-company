// Script de géocodage utilisant Google Maps (plus précis)
import { config } from "dotenv";
import { createRequire } from "module";
const require = createRequire(import.meta.url);

// Charger les variables d'environnement
config({ path: `${process.cwd()}/.env.local` });

async function geocodeWithGoogle() {
  try {
    // Configuration Google Maps
    const nodeGeocoder = require("node-geocoder");

    // ⚠️ REMPLACEZ PAR VOTRE CLÉ API GOOGLE MAPS
    const GOOGLE_MAPS_API_KEY =
      process.env.GOOGLE_MAPS_API_KEY || "YOUR_GOOGLE_MAPS_API_KEY";

    if (GOOGLE_MAPS_API_KEY === "YOUR_GOOGLE_MAPS_API_KEY") {
      console.log(
        "❌ Veuillez configurer votre clé API Google Maps dans GOOGLE_MAPS_API_KEY"
      );
      console.log(
        "📝 Obtenez une clé sur: https://console.cloud.google.com/apis/credentials"
      );
      console.log(
        "💰 Google Maps Geocoding API: 40,000 requêtes gratuites/mois"
      );
      process.exit(1);
    }

    const geocoder = nodeGeocoder({
      provider: "google",
      apiKey: GOOGLE_MAPS_API_KEY,
      // Options pour la France
      region: "FR",
      language: "fr",
    });

    // Importer la DB
    const { db } = await import("../lib/db.js");
    const { companies } = await import("../lib/schema.js");
    const { eq, and, isNull, isNotNull } = await import("drizzle-orm");

    console.log("🏢 Recherche des entreprises sans coordonnées...\n");

    // Trouver toutes les entreprises avec adresse mais sans coordonnées
    const companiesToGeocode = await db
      .select({
        id: companies.id,
        name: companies.name,
        address: companies.address,
        city: companies.city,
      })
      .from(companies)
      .where(
        and(
          isNotNull(companies.address), // Adresse non nulle
          isNotNull(companies.city), // Ville non nulle
          isNull(companies.coordinates) // Pas de coordonnées
        )
      );

    console.log(
      `📍 ${companiesToGeocode.length} entreprise(s) à géocoder avec Google Maps:\n`
    );

    let successCount = 0;
    let failureCount = 0;

    for (const company of companiesToGeocode) {
      console.log(`🏢 Géocodage Google Maps: ${company.name}`);
      console.log(`📍 Adresse: ${company.address}, ${company.city}`);

      try {
        // Géocodage avec Google Maps
        const results = await geocoder.geocode(
          `${company.address}, ${company.city}, France`
        );

        if (results && results.length > 0) {
          const result = results[0]; // Premier résultat (le plus pertinent)

          const coordinates = {
            lat: result.latitude,
            lng: result.longitude,
          };

          console.log(`✅ Google Maps trouvé:`);
          console.log(`   📍 [${coordinates.lat}, ${coordinates.lng}]`);
          console.log(`   🏠 Adresse complète: ${result.formattedAddress}`);
          console.log(`   🎯 Précision: ${result.extra?.confidence || "N/A"}`);

          // Mettre à jour la base de données
          await db
            .update(companies)
            .set({ coordinates })
            .where(eq(companies.id, company.id));

          console.log(`💾 Coordonnées sauvegardées en base\n`);
          successCount++;
        } else {
          console.log(`❌ Aucun résultat Google Maps\n`);
          failureCount++;
        }
      } catch (error) {
        console.error(`💥 Erreur Google Maps: ${error.message}\n`);

        // Si erreur API (quota dépassé, etc.), arrêter
        if (
          error.message.includes("API key") ||
          error.message.includes("quota")
        ) {
          console.log(
            "🚫 Erreur API Google Maps - Vérifiez votre clé et votre quota"
          );
          break;
        }

        failureCount++;
      }

      // Pause importante entre les requêtes Google Maps (éviter quota)
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }

    console.log("🎯 Résumé Google Maps:");
    console.log(`✅ ${successCount} entreprise(s) géocodée(s) avec succès`);
    console.log(`❌ ${failureCount} entreprise(s) échouée(s)`);

    if (successCount > 0) {
      console.log("\n🎉 Google Maps est bien plus précis que Nominatim !");
      console.log("📊 Les coordonnées sont maintenant exactes.");
    }
  } catch (error) {
    console.error("💥 Erreur générale:", error);
  }
}

geocodeWithGoogle().then(() => {
  console.log("🏁 Géocodage Google Maps terminé");
  process.exit(0);
});
