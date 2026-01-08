// Script de test pour l'API de mise à jour d'entreprise
async function testCompanyUpdateAPI() {
  try {
    console.log("🧪 Test de l'API /api/company/update...\n");

    const testData = {
      name: "Entreprise Test Mise à Jour",
      description: "Description mise à jour pour les tests",
      email: "test-updated@example.com",
      phone: "+33123456789",
      address: "123 Rue Test Mise à Jour",
      website: "https://test-updated.com",
      founded: "2024", // Valeur spécifique à tester
      size: "50-100",
      values: ["innovation", "sustainability"],
      areaId: "1",
    };

    console.log("📤 Envoi des données de test:");
    console.log(JSON.stringify(testData, null, 2));

    console.log("\n🔗 Appel de l'API...");

    const response = await fetch("http://localhost:3000/api/company/update", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testData),
    });

    console.log(`📊 Status de la réponse: ${response.status}`);

    const result = await response.json();
    console.log("\n📋 Réponse de l'API:");
    console.log(JSON.stringify(result, null, 2));

    if (response.ok && result.success) {
      console.log("\n✅ Mise à jour réussie selon l'API");
      console.log(`📅 Founded mis à jour: ${result.company?.founded}`);
    } else {
      console.log("\n❌ Erreur API:", result.error);
    }
  } catch (error) {
    console.log(
      "❌ Erreur de connexion:",
      error instanceof Error ? error.message : error
    );
    console.log("\n🔧 Vérifiez que:");
    console.log("1. Le serveur Next.js est démarré: npm run dev");
    console.log("2. Il écoute sur le port 3000");
  }
}

testCompanyUpdateAPI();
