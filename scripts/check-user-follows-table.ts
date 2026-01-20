import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";

// Charger les variables d'environnement
config({ path: `${process.cwd()}/.env` });

async function checkUserFollowsTable() {
  try {
    console.log("🔍 Vérification de la table user_follows...");
    console.log("DATABASE_URL:", process.env.DATABASE_URL ? "✅ Définie" : "❌ Non définie");

    const sql = neon(process.env.DATABASE_URL!);

    // Vérifier si la table existe
    const tablesResult = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = 'user_follows'
    `;

    if (tablesResult.length > 0) {
      console.log("✅ La table user_follows existe");
      
      // Vérifier les colonnes
      const columnsResult = await sql`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'user_follows'
        ORDER BY ordinal_position
      `;
      
      console.log("📊 Colonnes de la table:");
      columnsResult.forEach((col: any) => {
        console.log(`   - ${col.column_name} (${col.data_type})`);
      });

      // Vérifier les index
      const indexesResult = await sql`
        SELECT indexname
        FROM pg_indexes
        WHERE schemaname = 'public'
        AND tablename = 'user_follows'
      `;
      
      console.log("📊 Index de la table:");
      indexesResult.forEach((idx: any) => {
        console.log(`   - ${idx.indexname}`);
      });
    } else {
      console.log("❌ La table user_follows n'existe pas");
      console.log("💡 Exécutez: npm run db:apply-user-follows");
    }
  } catch (error) {
    console.error("❌ Erreur lors de la vérification:", error);
    process.exit(1);
  }
}

checkUserFollowsTable();
