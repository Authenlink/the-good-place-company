import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";

// Charger les variables d'environnement
config({ path: `${process.cwd()}/.env` });

async function checkTable() {
  try {
    console.log("🔍 Vérification de la table user_company_memberships...");
    console.log("📡 Connexion à la base de données...");

    const sql = neon(process.env.DATABASE_URL!);

    // Vérifier si la table existe
    const tablesResult = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = 'user_company_memberships'
    `;

    if (tablesResult.length > 0) {
      console.log("✅ La table user_company_memberships existe !");

      // Afficher les colonnes
      const columns = await sql`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'user_company_memberships'
        AND table_schema = 'public'
        ORDER BY ordinal_position
      `;

      console.log("\n📋 Colonnes:");
      columns.forEach((row: any) => {
        console.log(
          `   - ${row.column_name} (${row.data_type}) ${row.is_nullable === "NO" ? "NOT NULL" : "NULL"}`,
        );
      });

      // Vérifier les index
      const indexes = await sql`
        SELECT indexname
        FROM pg_indexes
        WHERE schemaname = 'public'
        AND tablename = 'user_company_memberships'
      `;

      console.log("\n📊 Index:");
      indexes.forEach((row: any) => {
        console.log(`   - ${row.indexname}`);
      });
    } else {
      console.log("❌ La table user_company_memberships n'existe PAS !");
      console.log("\n💡 Vous devez exécuter la migration:");
      console.log("   npm run db:apply-user-company-memberships");
    }
  } catch (error: any) {
    console.error("❌ Erreur:", error.message);
    console.error("\n🔍 Détails:", error);
  }
}

checkTable();
