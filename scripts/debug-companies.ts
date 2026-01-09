import { db } from "../lib/db";
import { companies } from "../lib/schema";
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
        coordinates: companies.coordinates,
      })
      .from(companies)
      .where(eq(companies.city, "Marseille"));

    console.log("🏙️ Entreprises à Marseille:");
    marseilleCompanies.forEach((company) => {
      console.log(`- ${company.name}`);
      console.log(`  Adresse: ${company.address || "Non spécifiée"}`);
      console.log(
        `  Coordonnées: ${
          company.coordinates
            ? `Lat: ${company.coordinates.lat}, Lng: ${company.coordinates.lng}`
            : "Non spécifiées"
        }`
      );
      console.log("");
    });

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

    // Vérifier les entreprises sans coordonnées
    const companiesWithoutCoordinates = await db
      .select({
        id: companies.id,
        name: companies.name,
        city: companies.city,
        address: companies.address,
        coordinates: companies.coordinates,
      })
      .from(companies)
      .where(sql`${companies.coordinates} IS NULL`);

    console.log(
      `\n📍 Entreprises sans coordonnées GPS: ${companiesWithoutCoordinates.length}`
    );
    companiesWithoutCoordinates.slice(0, 5).forEach((company) => {
      console.log(
        `- ${company.name} (${company.city}) - ${
          company.address || "Adresse inconnue"
        }`
      );
    });

    // Vérifier les entreprises avec coordonnées
    const companiesWithCoordinates = await db
      .select({
        id: companies.id,
        name: companies.name,
        city: companies.city,
        coordinates: companies.coordinates,
      })
      .from(companies)
      .where(sql`${companies.coordinates} IS NOT NULL`);

    console.log(
      `\n✅ Entreprises avec coordonnées GPS: ${companiesWithCoordinates.length}`
    );
    companiesWithCoordinates.slice(0, 5).forEach((company) => {
      console.log(
        `- ${company.name} (${company.city}): Lat ${company.coordinates?.lat}, Lng ${company.coordinates?.lng}`
      );
    });
  } catch (error) {
    console.error("❌ Erreur:", error);
  }
}

debugCompanies().then(() => process.exit(0));
