// Script pour géocoder toutes les entreprises sans coordonnées
// Utilise plusieurs services de géocodage pour maximiser les chances de succès

async function geocodeAllCompanies() {
  try {
    // Import dynamique pour éviter les erreurs d'installation
    let geocoder;
    try {
      const nodeGeocoder = await import("node-geocoder");
      geocoder = nodeGeocoder.default({
        provider: "openstreetmap", // Nominatim (gratuit)
        // Alternative providers:
        // provider: 'google', apiKey: 'YOUR_API_KEY'
        // provider: 'mapbox', apiKey: 'YOUR_API_KEY'
      });
    } catch (error) {
      console.log(
        "⚠️ node-geocoder non installé, utilisation de fetch manuel..."
      );
      geocoder = null;
    }

    // Importer la DB
    const { db } = await import("./lib/db.js");
    const { companies } = await import("./lib/schema.js");
    const { eq, and, isNull } = await import("drizzle-orm");

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
          companies.address, // Adresse non nulle
          companies.city, // Ville non nulle
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

      try {
        if (geocoder) {
          // Utiliser node-geocoder si disponible
          const result = await geocoder.geocode(
            `${company.address}, ${company.city}, France`
          );

          if (result && result.length > 0) {
            coordinates = {
              lat: result[0].latitude,
              lng: result[0].longitude,
            };
            console.log(
              `✅ node-geocoder: [${coordinates.lat}, ${coordinates.lng}]`
            );
          }
        } else {
          // Fallback: fetch manuel vers Nominatim
          const query = encodeURIComponent(
            `${company.address}, ${company.city}, France`
          );
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1&countrycodes=fr`
          );

          if (response.ok) {
            const data = await response.json();
            if (data && data.length > 0) {
              coordinates = {
                lat: parseFloat(data[0].lat),
                lng: parseFloat(data[0].lon),
              };
              console.log(
                `✅ Nominatim: [${coordinates.lat}, ${coordinates.lng}]`
              );
            }
          }
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
          console.log(`❌ Aucune coordonnée trouvée\n`);
          failureCount++;
        }
      } catch (error) {
        console.error(`💥 Erreur lors du géocodage: ${error.message}\n`);
        failureCount++;
      }

      // Pause pour éviter de spammer l'API
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    console.log("🎯 Résumé du géocodage:");
    console.log(`✅ ${successCount} entreprise(s) géocodée(s) avec succès`);
    console.log(`❌ ${failureCount} entreprise(s) échouée(s)`);

    if (failureCount > 0) {
      console.log("\n💡 Pour les entreprises échouées:");
      console.log("1. Vérifiez que l'adresse est correcte");
      console.log("2. Essayez avec une adresse plus complète (code postal)");
      console.log(
        "3. Utilisez Google Maps pour trouver les coordonnées exactes"
      );
      console.log("4. Saisissez manuellement les coordonnées GPS");
    }
  } catch (error) {
    console.error("💥 Erreur générale:", error);
  }
}

geocodeAllCompanies().then(() => {
  console.log("🏁 Script terminé");
  process.exit(0);
});
