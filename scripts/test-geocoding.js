// Test rapide de géocodage pour déboguer
async function testGeocoding() {
  const addresses = [
    "12 rue Chateauredon, Marseille, France",
    "12 rue Chateauredon, Marseille",
    "rue Chateauredon, Marseille, France",
    "Marseille, France",
  ];

  for (const address of addresses) {
    try {
      console.log(`\n🔍 Test: ${address}`);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          address
        )}&limit=1&countrycodes=fr`
      );

      const data = await response.json();
      console.log(
        `📍 Résultat:`,
        data[0]
          ? {
              lat: data[0].lat,
              lon: data[0].lon,
              display_name: data[0].display_name,
            }
          : "AUCUN RÉSULTAT"
      );
    } catch (error) {
      console.error(`❌ Erreur:`, error);
    }

    // Pause entre les requêtes
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}

testGeocoding();
