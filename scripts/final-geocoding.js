// Script final de géocodage utilisant node-geocoder
import { createRequire } from "module";
const require = createRequire(import.meta.url);

async function finalGeocoding() {
  try {
    console.log("🚀 Démarrage du géocodage automatique des entreprises...\n");

    // Configuration du géocodage
    let geocoder;
    let provider = "nominatim"; // Par défaut

    try {
      const nodeGeocoder = require("node-geocoder");

      // Vérifier si Google Maps API key est disponible
      const googleApiKey = process.env.GOOGLE_MAPS_API_KEY;

      if (googleApiKey && googleApiKey !== "YOUR_GOOGLE_MAPS_API_KEY") {
        console.log("🎯 Utilisation de Google Maps (précision optimale)");
        geocoder = nodeGeocoder({
          provider: "google",
          apiKey: googleApiKey,
          region: "FR",
          language: "fr",
        });
        provider = "google";
      } else {
        console.log("📍 Utilisation de Nominatim (gratuit)");
        console.log(
          "💡 Pour de meilleurs résultats, configurez GOOGLE_MAPS_API_KEY"
        );
        geocoder = nodeGeocoder({
          provider: "openstreetmap",
        });
      }
    } catch (error) {
      console.error("❌ Erreur lors du chargement de node-geocoder:", error);
      console.log(
        "💡 Assurez-vous que node-geocoder est installé: npm install node-geocoder"
      );
      process.exit(1);
    }

    // Importer la base de données
    const { db } = await import("./lib/db.js");
    const { companies } = await import("./lib/schema.js");
    const { eq, and, isNull } = await import("drizzle-orm");

    // Trouver toutes les entreprises sans coordonnées
    const companiesToGeocode = await db
      .select({
        id: companies.id,
        name: companies.name,
        address: companies.address,
        city: companies.city,
      })
      .from(companies)
      .where(
        and(companies.address, companies.city, isNull(companies.coordinates))
      );

    if (companiesToGeocode.length === 0) {
      console.log("✅ Toutes les entreprises ont déjà des coordonnées !");
      return;
    }

    console.log(`📍 ${companiesToGeocode.length} entreprise(s) à géocoder:\n`);

    let successCount = 0;
    let failureCount = 0;

    for (const company of companiesToGeocode) {
      console.log(`🏢 Géocodage: ${company.name}`);
      console.log(`📍 Adresse: ${company.address}, ${company.city}`);

      try {
        // Géocodage
        const results = await geocoder.geocode(
          `${company.address}, ${company.city}, France`
        );

        if (results && results.length > 0) {
          const result = results[0];
          const coordinates = {
            lat: result.latitude,
            lng: result.longitude,
          };

          console.log(`✅ ${provider.toUpperCase()} trouvé:`);
          console.log(`   📍 Latitude: ${coordinates.lat}`);
          console.log(`   📍 Longitude: ${coordinates.lng}`);
          if (result.formattedAddress) {
            console.log(`   🏠 Adresse complète: ${result.formattedAddress}`);
          }

          // Mettre à jour la base de données
          await db
            .update(companies)
            .set({ coordinates })
            .where(eq(companies.id, company.id));

          console.log(`💾 Coordonnées sauvegardées en base\n`);
          successCount++;
        } else {
          console.log(`❌ Aucune coordonnée trouvée\n`);
          failureCount++;
        }
      } catch (error) {
        console.error(`💥 Erreur de géocodage: ${error.message}\n`);
        failureCount++;
      }

      // Pause pour éviter de spammer l'API
      const delay = provider === "google" ? 1500 : 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    console.log("🎯 RÉSULTATS FINAUX:");
    console.log(`✅ ${successCount} entreprise(s) géocodée(s) avec succès`);
    console.log(`❌ ${failureCount} entreprise(s) échouée(s)`);

    if (successCount > 0) {
      console.log("\n🎉 Géocodage terminé !");
      console.log(
        "📍 Les entreprises apparaîtront maintenant correctement sur la carte."
      );
    }

    if (failureCount > 0) {
      console.log("\n💡 Pour les entreprises échouées:");
      console.log("1. Vérifiez que l'adresse est correcte");
      console.log("2. Essayez avec une adresse plus complète (code postal)");
      console.log("3. Utilisez l'interface admin: /admin/geocode");
    }
  } catch (error) {
    console.error("💥 Erreur générale:", error);
    process.exit(1);
  }
}

finalGeocoding().then(() => {
  console.log("🏁 Géocodage terminé avec succès !");
  process.exit(0);
});
