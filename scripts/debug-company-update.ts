// Script de debug pour la mise à jour d'entreprise
import { db } from "../lib/db";
import { companies } from "../lib/schema";
import { eq } from "drizzle-orm";

async function debugCompanyUpdate() {
  try {
    console.log("🔍 Debug de la mise à jour d'entreprise...\n");

    // Vérifier toutes les entreprises en base
    console.log("📊 Toutes les entreprises en base:");
    const allCompanies = await db.select().from(companies);
    console.log(`- Nombre total d'entreprises: ${allCompanies.length}`);

    allCompanies.forEach((company, index) => {
      console.log(
        `  ${index + 1}. ID: ${company.id}, UserID: ${company.userId}, Name: ${
          company.name
        }, Founded: ${company.founded}`
      );
    });

    console.log("\n🔍 Recherche d'entreprises pour userId = 1:");
    const userCompanies = await db
      .select()
      .from(companies)
      .where(eq(companies.userId, 1));

    if (userCompanies.length === 0) {
      console.log("❌ Aucune entreprise trouvée pour userId = 1");
      console.log("Création d'une entreprise de test...");

      const insertResult = await db
        .insert(companies)
        .values({
          userId: 1,
          name: "Entreprise Test",
          description: "Description test",
          email: "test@example.com",
          founded: "2020",
          size: "10-50",
        })
        .returning();

      console.log("✅ Entreprise créée:", insertResult[0]);
    } else {
      console.log("✅ Entreprise trouvée:");
      const company = userCompanies[0];
      console.log(`- ID: ${company.id}`);
      console.log(`- Name: ${company.name}`);
      console.log(`- Founded: ${company.founded}`);
      console.log(`- UpdatedAt: ${company.updatedAt}`);

      // Tester la mise à jour
      console.log("\n📝 Test de mise à jour du champ 'founded'...");
      const newFoundedValue = `2024-${Math.floor(Math.random() * 12) + 1}`;
      console.log(`Nouvelle valeur pour founded: ${newFoundedValue}`);

      const updateResult = await db
        .update(companies)
        .set({
          founded: newFoundedValue,
          updatedAt: new Date(),
        })
        .where(eq(companies.userId, 1))
        .returning();

      if (updateResult.length > 0) {
        console.log("✅ Mise à jour réussie:");
        console.log(`- Founded: ${updateResult[0].founded}`);
        console.log(`- UpdatedAt: ${updateResult[0].updatedAt}`);
      } else {
        console.log("❌ Échec de la mise à jour");
      }

      // Vérifier que ça persiste
      console.log("\n🔍 Vérification de la persistance...");
      const verifyResult = await db
        .select()
        .from(companies)
        .where(eq(companies.userId, 1));

      if (verifyResult.length > 0) {
        console.log(
          `✅ Valeur persistante - Founded: ${verifyResult[0].founded}`
        );
      }
    }

    console.log("\n🎯 Test terminé");
  } catch (error) {
    console.error("❌ Erreur lors du debug:", error);
  }
}

debugCompanyUpdate();
