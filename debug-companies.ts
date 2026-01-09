import { db } from "./lib/db";
import { companies } from "./lib/schema";
import { eq, sql } from "drizzle-orm";

async function debugCompanies() {
  try {
    console.log("🔍 Vérification des entreprises...\n");

    // Vérifier Marseille spécifiquement
    const marseilleCompanies = await db
      .select({
        id: companies.id,
        name: companies.name,
        address: companies.address,
        city: companies.city,
      })
      .from(companies)
      .where(eq(companies.city, "Marseille"));

    console.log("🏙️ Entreprises à Marseille:", marseilleCompanies);

    // Vérifier toutes les villes
    const allCities = await db
      .select({
        city: companies.city,
        count: sql<number>`count(*)`,
      })
      .from(companies)
      .groupBy(companies.city)
      .orderBy(sql`count(*) desc`);

    console.log("\n📊 Statistiques par ville:");
    allCities.forEach(({ city, count }) => {
      console.log(`${city || "Ville inconnue"}: ${count} entreprise(s)`);
    });

    // Vérifier les entreprises sans adresse
    const companiesWithoutAddress = await db
      .select({
        id: companies.id,
        name: companies.name,
        city: companies.city,
        address: companies.address,
      })
      .from(companies)
      .where(sql`${companies.address} IS NULL OR ${companies.address} = ''`);

    console.log(
      `\n⚠️ Entreprises sans adresse: ${companiesWithoutAddress.length}`
    );
    companiesWithoutAddress.slice(0, 5).forEach((company) => {
      console.log(`- ${company.name} (${company.city})`);
    });
  } catch (error) {
    console.error("❌ Erreur:", error);
  }
}

debugCompanies().then(() => process.exit(0));
