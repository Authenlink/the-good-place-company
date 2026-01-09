import { db } from "@/lib/db";
import { companies, companyValues } from "@/lib/schema";
import { eq } from "drizzle-orm";

async function debugCompanyValues() {
  try {
    console.log("🔍 Debug des valeurs des entreprises...\n");

    // Récupérer la compagnie par défaut
    const company = await db
      .select()
      .from(companies)
      .where(eq(companies.userId, 1))
      .limit(1);

    if (company.length === 0) {
      console.log("❌ Aucune compagnie trouvée pour userId 1");
      return;
    }

    const comp = company[0];
    console.log("🏢 Compagnie trouvée:", comp.name);
    console.log("📋 Valeurs brutes:", comp.values);

    if (comp.values && comp.values.length > 0) {
      console.log(
        "🔢 IDs des valeurs:",
        comp.values.map((v) => parseInt(v))
      );

      // Récupérer les valeurs correspondantes
      const values = await db
        .select({
          id: companyValues.id,
          name: companyValues.name,
          color: companyValues.color,
        })
        .from(companyValues)
        .where(eq(companyValues.id, parseInt(comp.values[0]))); // Test avec la première valeur

      console.log("🎨 Valeur récupérée:", values);
    } else {
      console.log("❌ Aucune valeur définie pour cette compagnie");
    }

    // Lister toutes les valeurs disponibles
    console.log("\n📊 Toutes les valeurs disponibles:");
    const allValues = await db
      .select({
        id: companyValues.id,
        name: companyValues.name,
        color: companyValues.color,
      })
      .from(companyValues)
      .orderBy(companyValues.id);

    allValues.forEach((value) => {
      console.log(`  ${value.id}. ${value.name} (${value.color})`);
    });
  } catch (error) {
    console.error("❌ Erreur:", error);
  } finally {
    process.exit(0);
  }
}

debugCompanyValues();
