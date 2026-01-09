import { db } from "../lib/db.js";
import { companies } from "../lib/schema.js";
import { eq } from "drizzle-orm";

async function checkCoordinates() {
  try {
    console.log("🔍 Vérification des coordonnées en base de données...\n");

    // Récupérer toutes les entreprises de Marseille
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

    console.log(`🏙️ Entreprises à Marseille: ${marseilleCompanies.length}`);

    marseilleCompanies.forEach((company, index) => {
      console.log(`${index + 1}. ${company.name}`);
      console.log(`   - Adresse: ${company.address || "N/A"}`);
      console.log(`   - Ville: ${company.city}`);
      console.log(
        `   - Coordonnées: ${
          company.coordinates
            ? `Lat: ${company.coordinates.lat}, Lng: ${company.coordinates.lng}`
            : "❌ AUCUNE COORDONNÉE"
        }`
      );
      console.log(`   - Type de coordinates: ${typeof company.coordinates}`);
      if (company.coordinates) {
        console.log(
          `   - Structure:`,
          JSON.stringify(company.coordinates, null, 2)
        );
      }
      console.log("");
    });

    // Vérifier aussi une entreprise spécifique si elle existe
    if (marseilleCompanies.length > 0) {
      const firstCompany = marseilleCompanies[0];
      console.log(`🔍 Analyse détaillée de ${firstCompany.name}:`);
      console.log(`   - coordinates est défini: ${!!firstCompany.coordinates}`);
      if (firstCompany.coordinates) {
        console.log(
          `   - coordinates.lat existe: ${!!firstCompany.coordinates.lat}`
        );
        console.log(
          `   - coordinates.lng existe: ${!!firstCompany.coordinates.lng}`
        );
        console.log(
          `   - lat est un nombre: ${
            typeof firstCompany.coordinates.lat === "number"
          }`
        );
        console.log(
          `   - lng est un nombre: ${
            typeof firstCompany.coordinates.lng === "number"
          }`
        );
      }
    }
  } catch (error) {
    console.error("❌ Erreur:", error);
  } finally {
    process.exit(0);
  }
}

checkCoordinates();
