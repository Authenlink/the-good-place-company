// Test spécifique pour l'adresse de Marseille
async function testMarseilleAddress() {
  console.log("🧪 Test de géocodage pour Marseille\n");

  const testAddresses = [
    "12 rue Chateauredon, Marseille, France",
    "12 rue Chateauredon Marseille France",
    "rue Chateauredon Marseille",
    "Chateauredon Marseille France",
    "Marseille France",
  ];

  for (const address of testAddresses) {
    try {
      console.log(`\n🔍 Test: "${address}"`);

      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        address
      )}&limit=1&countrycodes=fr`;
      console.log(`🌐 URL: ${url}`);

      const response = await fetch(url);

      if (!response.ok) {
        console.log(`❌ Erreur HTTP: ${response.status}`);
        continue;
      }

      const data = await response.json();

      if (data && data.length > 0) {
        console.log(`✅ TROUVÉ !`);
        console.log(`   📍 Latitude: ${data[0].lat}`);
        console.log(`   📍 Longitude: ${data[0].lon}`);
        console.log(`   🏠 Adresse complète: ${data[0].display_name}`);
        console.log(`   🎯 Coordonnées: [${data[0].lat}, ${data[0].lon}]`);
      } else {
        console.log(`❌ Aucun résultat trouvé`);
      }
    } catch (error) {
      console.log(`💥 Erreur: ${error.message}`);
    }

    // Pause pour éviter de spammer
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }

  console.log(
    "\n🎯 Si aucune adresse ne fonctionne, essayez de chercher l'adresse exacte sur https://www.openstreetmap.org/"
  );
  console.log(
    "💡 Ou utilisez les coordonnées GPS directement dans la base de données"
  );
}

testMarseilleAddress();
