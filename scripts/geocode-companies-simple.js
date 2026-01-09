// Script simple pour géocoder les entreprises avec Nominatim (gratuit)
import { config } from "dotenv";
import { db } from "../lib/db.js";
import { companies } from "../lib/schema.js";
import { eq, and, isNull, isNotNull } from "drizzle-orm";

// Charger les variables d'environnement
config({ path: `${process.cwd()}/.env.local` });

async function geocodeCompanies() {
  try {
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

    console.log(`📍 ${companiesToGeocode.length} entreprise(s) à géocoder:\n`);

    let successCount = 0;
    let failureCount = 0;

    for (const company of companiesToGeocode) {
      console.log(`🏢 Géocodage de: ${company.name}`);
      console.log(`📍 Adresse: ${company.address}, ${company.city}`);

      let coordinates = null;

      // Essayer plusieurs formats d'adresse
      const addressFormats = [
        `${company.address}, ${company.city}, France`,
        `${company.address}, ${company.city}`,
        `${company.city}, France`,
      ];

      for (const address of addressFormats) {
        if (coordinates) break; // Si trouvé, arrêter

        try {
          console.log(`🔍 Essai: "${address}"`);

          const query = encodeURIComponent(address);
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1&countrycodes=fr`
          );

          if (response.ok) {
            const data = await response.json();

            if (data && data.length > 0 && data[0].lat && data[0].lon) {
              coordinates = {
                lat: parseFloat(data[0].lat),
                lng: parseFloat(data[0].lon),
              };

              console.log(
                `✅ Trouvé: [${coordinates.lat}, ${coordinates.lng}] via "${address}"`
              );
              break; // Sortir de la boucle des formats
            } else {
              console.log(`❌ Aucun résultat pour "${address}"`);
            }
          } else {
            console.log(`⚠️ Erreur HTTP ${response.status} pour "${address}"`);
          }
        } catch (error) {
          console.error(`💥 Erreur réseau: ${error.message}`);
        }

        // Petite pause entre les requêtes
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      if (coordinates) {
        // Mettre à jour la base de données
        await db
          .update(companies)
          .set({ coordinates })
          .where(eq(companies.id, company.id));

        console.log(`💾 Coordonnées sauvegardées en base\n`);
        successCount++;
      } else {
        console.log(`❌ Impossible de géocoder cette entreprise\n`);
        failureCount++;
      }

      // Pause entre les entreprises pour éviter de spammer
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    console.log("🎯 Résumé:");
    console.log(`✅ ${successCount} entreprise(s) géocodée(s)`);
    console.log(`❌ ${failureCount} entreprise(s) échouée(s)`);

    if (failureCount > 0) {
      console.log("\n💡 Solutions pour les échecs:");
      console.log("1. Vérifiez que l'adresse existe vraiment");
      console.log(
        "2. Ajoutez le code postal: '12 rue Chateauredon, 13001 Marseille'"
      );
      console.log(
        "3. Utilisez Google Maps pour trouver les coordonnées exactes"
      );
      console.log(
        '4. Saisissez manuellement: UPDATE companies SET coordinates = \'{"lat": 43.2965, "lng": 5.3698}\' WHERE id = ...'
      );
    }
  } catch (error) {
    console.error("💥 Erreur générale:", error);
  }
}

geocodeCompanies().then(() => {
  console.log("🏁 Géocodage terminé");
  process.exit(0);
});
