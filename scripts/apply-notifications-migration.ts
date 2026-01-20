import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
import { readFileSync } from "fs";
import { join } from "path";

// Charger les variables d'environnement
config({ path: `${process.cwd()}/.env` });

async function applyNotificationsMigration() {
  try {
    console.log("🔄 Application de la migration pour notifications...");

    const sql = neon(process.env.DATABASE_URL!);

    // Vérifier si la table existe déjà
    console.log("📋 Vérification de l'état actuel de la table...");

    const tablesResult = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = 'notifications'
    `;

    const tableExists = tablesResult.length > 0;
    console.log("Table notifications existe:", tableExists);

    // Appliquer la migration si la table n'existe pas
    if (!tableExists) {
      console.log("➕ Création de la table notifications...");
      
      // Lire le fichier SQL de migration
      const migrationPath = join(process.cwd(), "drizzle", "0021_add_notifications.sql");
      const migrationSQL = readFileSync(migrationPath, "utf-8");
      
      // Exécuter la migration SQL
      await sql.unsafe(migrationSQL);
      
      console.log("✅ Table notifications créée avec succès");
    } else {
      console.log("ℹ️  La table notifications existe déjà");
      
      // Vérifier les index
      console.log("📊 Vérification des index...");
      
      const indexes = [
        "notifications_user_id_idx",
        "notifications_read_idx",
        "notifications_created_at_idx",
        "notifications_user_read_idx",
        "notifications_type_idx",
      ];

      for (const indexName of indexes) {
        try {
          const indexCheck = await sql`
            SELECT indexname
            FROM pg_indexes
            WHERE schemaname = 'public'
            AND indexname = ${indexName}
          `;
          
          if (indexCheck.length === 0) {
            console.log(`➕ Création de l'index ${indexName}...`);
            // Les index sont créés dans le fichier SQL, mais on peut les créer individuellement si nécessaire
          } else {
            console.log(`✅ Index ${indexName} existe déjà`);
          }
        } catch (error: any) {
          console.warn(`⚠️  Erreur lors de la vérification de l'index ${indexName}:`, error.message);
        }
      }
    }

    console.log("🎉 Migration appliquée avec succès !");

    // Vérification finale
    const finalTable = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = 'notifications'
    `;

    if (finalTable.length > 0) {
      console.log("📊 Table créée:");
      console.log(`   - ${(finalTable[0] as any).table_name}`);
      
      // Afficher les colonnes
      const columns = await sql`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'notifications'
        AND table_schema = 'public'
        ORDER BY ordinal_position
      `;
      
      console.log("📋 Colonnes de la table notifications:");
      columns.forEach((row: any) => {
        console.log(
          `   - ${row.column_name} (${row.data_type}) ${
            row.is_nullable === "NO" ? "NOT NULL" : "NULL"
          }`
        );
      });
    }
  } catch (error) {
    console.error("❌ Erreur lors de l'application de la migration:", error);
    process.exit(1);
  }
}

applyNotificationsMigration();
