// Script pour tester les données de la carte
async function testMapData() {
  try {
    console.log("🗺️ Test des données de la carte...\n");

    // Test de l'API des entreprises de Marseille
    const response = await fetch(
      "http://localhost:3000/api/companies/city/Marseille"
    );

    if (!response.ok) {
      console.error(`❌ Erreur API: ${response.status}`);
      return;
    }

    const data = await response.json();
    console.log("📊 Réponse API:", JSON.stringify(data, null, 2));

    if (data.companies && data.companies.length > 0) {
      console.log(`\n🏢 ${data.companies.length} entreprise(s) trouvée(s):`);
      data.companies.forEach((company, index) => {
        console.log(`${index + 1}. ${company.name}`);
        console.log(`   - Adresse: ${company.address || "N/A"}`);
        console.log(`   - Ville: ${company.city || "N/A"}`);
        console.log(
          `   - Coordonnées: ${
            company.coordinates
              ? `Lat: ${company.coordinates.lat}, Lng: ${company.coordinates.lng}`
              : "❌ AUCUNE COORDONNÉE"
          }`
        );
        console.log("");
      });
    } else {
      console.log("❌ Aucune entreprise trouvée");
    }
  } catch (error) {
    console.error("❌ Erreur:", error.message);
  }
}

testMapData();
