// Script de test pour vérifier la configuration
import { db } from "./lib/db.js";
import { companies } from "./lib/schema.js";
import { and, isNull } from "drizzle-orm";

async function testSetup() {
  try {
    console.log("🧪 Test de configuration...\n");

    // Vérifier la structure de la table companies
    console.log("📋 Vérification de la table companies:");
    const testCompany = await db.select().from(companies).limit(1);

    if (testCompany.length > 0) {
      console.log("✅ Table companies accessible");
      console.log("📊 Colonnes disponibles:", Object.keys(testCompany[0]));
      console.log("🔍 Test avec une entreprise:", {
        id: testCompany[0].id,
        name: testCompany[0].name,
        hasAddress: !!testCompany[0].address,
        hasCity: !!testCompany[0].city,
        hasCoordinates: !!testCompany[0].coordinates,
      });
    }

    // Compter les entreprises sans coordonnées
    const companiesWithoutCoords = await db
      .select({ count: companies.id })
      .from(companies)
      .where(
        and(companies.address, companies.city, isNull(companies.coordinates))
      );

    console.log(
      `\n📍 Entreprises à géocoder: ${companiesWithoutCoords.length}`
    );

    // Tester node-geocoder
    try {
      const nodeGeocoder = await import("node-geocoder");
      console.log("✅ node-geocoder est installé");

      const geocoder = nodeGeocoder.default({
        provider: "openstreetmap",
      });

      // Test rapide avec une adresse connue
      console.log("🔍 Test de géocodage rapide...");
      const testResults = await geocoder.geocode("Marseille, France");

      if (testResults && testResults.length > 0) {
        console.log("✅ Géocodage fonctionnel");
        console.log(
          `📍 Test Marseille: [${testResults[0].latitude}, ${testResults[0].longitude}]`
        );
      } else {
        console.log("❌ Géocodage ne fonctionne pas");
      }
    } catch (error) {
      console.log("❌ node-geocoder n'est pas installé ou ne fonctionne pas");
      console.log("💡 Installez-le avec: npm install node-geocoder");
    }

    // Vérifier les variables d'environnement
    console.log("\n🔧 Variables d'environnement:");
    console.log(
      "GOOGLE_MAPS_API_KEY:",
      process.env.GOOGLE_MAPS_API_KEY ? "✅ Configurée" : "❌ Manquante"
    );

    console.log("\n🎯 Configuration terminée !");
  } catch (error) {
    console.error("❌ Erreur lors du test:", error);
  }
}

testSetup().then(() => {
  console.log("\n🏁 Test terminé");
  process.exit(0);
});
