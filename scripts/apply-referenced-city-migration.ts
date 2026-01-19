import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";

// Charger les variables d'environnement
config({ path: `${process.cwd()}/.env` });

async function applyReferencedCityMigration() {
  try {
    console.log("🔄 Application de la migration pour referenced_city...");

    const sql = neon(process.env.DATABASE_URL!);

    // Vérifier si la colonne existe déjà
    console.log("📋 Vérification de l'état actuel de la table users...");

    const usersColumnsResult = await sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'users'
      AND table_schema = 'public'
      AND column_name = 'referenced_city'
    `;

    const existingColumns = usersColumnsResult.map(
      (row) => (row as any).column_name
    );
    console.log("Colonnes existantes dans users:", existingColumns);

    // Appliquer la migration si nécessaire
    if (!existingColumns.includes("referenced_city")) {
      console.log("➕ Ajout de referenced_city à users...");
      await sql`ALTER TABLE users ADD COLUMN referenced_city text`;
      console.log("✅ Colonne referenced_city ajoutée à users");
    } else {
      console.log("ℹ️  La colonne referenced_city existe déjà");
    }

    console.log("🎉 Migration appliquée avec succès !");

    // Vérification finale
    const finalColumns = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'users'
      AND table_schema = 'public'
      AND column_name = 'referenced_city'
    `;

    console.log("📊 État final de la colonne referenced_city dans users:");
    finalColumns.forEach((row: any) => {
      console.log(
        `   - ${row.column_name} (${row.data_type}) ${
          row.is_nullable === "NO" ? "NOT NULL" : "NULL"
        }${row.column_default ? ` DEFAULT ${row.column_default}` : ""}`
      );
    });
  } catch (error) {
    console.error("❌ Erreur lors de l'application de la migration:", error);
    process.exit(1);
  }
}

applyReferencedCityMigration();
