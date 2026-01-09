// Test rapide de l'API récupération entreprise
async function testCompanyAPI() {
  try {
    console.log("🧪 Test de l'API récupération entreprise...\n");

    // Tester avec une entreprise qui existe probablement
    const companyName = "The Good Place Company";

    console.log(`📤 Recherche de l'entreprise: "${companyName}"...`);

    const response = await fetch(`http://localhost:3000/api/companies/${encodeURIComponent(companyName)}`);

    console.log("Status:", response.status);

    if (response.status === 404) {
      console.log("ℹ️  Entreprise non trouvée - c'est normal si aucune entreprise n'a ce nom exact");
      console.log("🔍 Liste des entreprises disponibles:");

      // Lister toutes les entreprises pour voir ce qui existe
      const listResponse = await fetch("http://localhost:3000/api/companies");
      if (listResponse.ok) {
        const listData = await listResponse.json();
        console.log("Entreprises trouvées:");
        listData.companies.forEach((company: any) => {
          console.log(`  - "${company.name}"`);
        });
      }
      return;
    }

    const result = await response.json();

    if (response.ok) {
      console.log("✅ Entreprise trouvée !");
      console.log("- Nom:", result.company.name);
      console.log("- Description:", result.company.description?.substring(0, 50) + "...");
      console.log("- Email:", result.company.email);
      console.log("- Ville:", result.company.city);
      console.log("- Secteur:", result.company.area?.name);
      console.log("\n🎉 L'API fonctionne parfaitement !");
    } else {
      console.log("❌ Erreur API:", result.error);
    }
  } catch (error) {
    console.log(
      "❌ Erreur de connexion:",
      error instanceof Error ? error.message : error
    );
    console.log("\n🔧 Assurez-vous que:");
    console.log("1. Le serveur Next.js est démarré: npm run dev");
    console.log("2. Il écoute sur le port 3000");
  }
}

testCompanyAPI();
