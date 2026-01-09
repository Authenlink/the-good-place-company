import { db } from "@/lib/db";
import { companies, areas, companyValues } from "@/lib/schema";
import { eq, desc, inArray } from "drizzle-orm";

async function testAssociationsAPI() {
  try {
    console.log("🧪 Test de l'API associations...\n");

    // Récupérer les associations avec leur secteur d'activité
    const associations = await db
      .select({
        id: companies.id,
        name: companies.name,
        description: companies.description,
        logo: companies.logo,
        background: companies.background,
        areaId: companies.areaId,
        areaName: areas.name,
        values: companies.values,
        website: companies.website,
        address: companies.address,
        createdAt: companies.createdAt,
      })
      .from(companies)
      .leftJoin(areas, eq(companies.areaId, areas.id))
      .orderBy(desc(companies.createdAt));

    console.log("📋 Associations trouvées:", associations.length);
    associations.forEach((assoc, index) => {
      console.log(`${index + 1}. ${assoc.name}:`, {
        values: assoc.values,
        areaName: assoc.areaName,
      });
    });

    // Tester la récupération des valeurs pour la première association
    if (associations.length > 0) {
      const firstAssoc = associations[0];
      console.log(
        `\n🔍 Test récupération des valeurs pour "${firstAssoc.name}"...`
      );

      if (firstAssoc.values && firstAssoc.values.length > 0) {
        console.log("Valeurs brutes:", firstAssoc.values);
        const parsedIds = firstAssoc.values.map((v) => parseInt(v));
        console.log("IDs parsés:", parsedIds);

        const valuesData = await db
          .select({ name: companyValues.name, color: companyValues.color })
          .from(companyValues)
          .where(inArray(companyValues.id, parsedIds))
          .limit(3);

        console.log("Données des valeurs récupérées:", valuesData);

        const valueNames = valuesData.map((v) => ({
          name: v.name,
          color: v.color,
        }));
        console.log("Valeurs formatées:", valueNames);
      } else {
        console.log("❌ Aucune valeur définie pour cette association");
      }
    }

    // Vérifier les valeurs disponibles
    console.log("\n📊 Valeurs disponibles dans la base:");
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
    console.error("❌ Erreur lors du test:", error);
  } finally {
    process.exit(0);
  }
}

testAssociationsAPI();
