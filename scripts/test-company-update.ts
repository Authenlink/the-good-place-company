// Script de test pour vérifier que la mise à jour d'entreprise fonctionne
import { db } from "../lib/db";
import { companies } from "../lib/schema";
import { eq } from "drizzle-orm";

async function testCompanyUpdate() {
  try {
    console.log("🧪 Test de mise à jour d'entreprise...\n");

    // Vérifier s'il y a déjà une entreprise pour userId = 1
    const existingCompany = await db
      .select()
      .from(companies)
      .where(eq(companies.userId, 1))
      .limit(1);

    console.log("📊 État initial:");
    console.log("- Entreprises trouvées:", existingCompany.length);

    if (existingCompany.length > 0) {
      console.log("- Nom actuel:", existingCompany[0].name);
      console.log("- Email actuel:", existingCompany[0].email);
      console.log("- Description actuelle:", existingCompany[0].description);
    }

    // Simuler les données de mise à jour
    const updateData = {
      name: "Entreprise Test Modifiée " + new Date().toISOString(),
      description: "Description mise à jour pour les tests - " + Math.random(),
      email: "test-updated-" + Math.random() + "@example.com",
      phone: "+33123456789",
      address: "123 Rue Test, Paris",
      website: "https://updated-test.com",
      founded: "2020",
      size: "10-50",
      updatedAt: new Date(),
    };

    console.log("\n📝 Mise à jour avec les données:");
    console.log("- Nom:", updateData.name);
    console.log("- Email:", updateData.email);
    console.log("- Description:", updateData.description);

    // Effectuer la mise à jour
    const result = await db
      .update(companies)
      .set(updateData)
      .where(eq(companies.userId, 1))
      .returning();

    if (result.length === 0) {
      console.log("\n❌ Aucune entreprise trouvée pour userId = 1");
      console.log("Création d'une entreprise de test...");

      // Créer une entreprise de test si elle n'existe pas
      const insertResult = await db
        .insert(companies)
        .values({
          userId: 1,
          name: updateData.name,
          description: updateData.description,
          email: updateData.email,
          phone: updateData.phone,
          address: updateData.address,
          website: updateData.website,
          founded: updateData.founded,
          size: updateData.size,
        })
        .returning();

      console.log("✅ Entreprise créée:", insertResult[0]);
    } else {
      console.log("\n✅ Mise à jour réussie:");
      console.log("- ID:", result[0].id);
      console.log("- Nom mis à jour:", result[0].name);
      console.log("- Email mis à jour:", result[0].email);
      console.log("- Description mise à jour:", result[0].description);
      console.log("- Date de mise à jour:", result[0].updatedAt);
    }

    // Vérifier que les données persistent
    console.log("\n🔍 Vérification de la persistance...");
    const verifyResult = await db
      .select()
      .from(companies)
      .where(eq(companies.userId, 1))
      .limit(1);

    if (verifyResult.length > 0) {
      const company = verifyResult[0];
      console.log("✅ Données persistantes:");
      console.log("- Nom:", company.name);
      console.log("- Email:", company.email);
      console.log("- Description:", company.description);
      console.log("- Date de mise à jour:", company.updatedAt);
    }

    console.log("\n🎉 Test terminé avec succès !");
  } catch (error) {
    console.error("❌ Erreur lors du test:", error);
  }
}

testCompanyUpdate();
