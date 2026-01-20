import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";

// Charger les variables d'environnement
config({ path: `${process.cwd()}/.env` });

async function applyUserFollowsMigration() {
  try {
    console.log("🔄 Application de la migration pour user_follows...");

    const sql = neon(process.env.DATABASE_URL!);

    // Vérifier si la table existe déjà
    console.log("📋 Vérification de l'état actuel de la table...");

    const tablesResult = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = 'user_follows'
    `;

    const tableExists = tablesResult.length > 0;
    console.log("Table user_follows existe:", tableExists);

    // Appliquer la migration si la table n'existe pas
    if (!tableExists) {
      console.log("➕ Création de la table user_follows...");
      
      // Créer la table
      await sql`
        CREATE TABLE IF NOT EXISTS "user_follows" (
          "id" SERIAL PRIMARY KEY,
          "follower_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
          "following_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
          "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
          CONSTRAINT "user_follows_unique" UNIQUE("follower_id", "following_id"),
          CONSTRAINT "user_follows_no_self_follow" CHECK ("follower_id" != "following_id")
        )
      `;
      
      console.log("✅ Table user_follows créée");
    } else {
      console.log("ℹ️  La table user_follows existe déjà");
    }

    // Vérifier les index
    console.log("📊 Vérification des index...");
    
    const indexes = [
      { name: "user_follows_follower_id_idx", table: "user_follows", column: "follower_id" },
      { name: "user_follows_following_id_idx", table: "user_follows", column: "following_id" },
      { name: "user_follows_created_at_idx", table: "user_follows", column: "created_at" },
    ];

    for (const index of indexes) {
      try {
        await sql.unsafe(`CREATE INDEX IF NOT EXISTS "${index.name}" ON "${index.table}"("${index.column}")`);
        console.log(`✅ Index ${index.name} créé/vérifié`);
      } catch (error: any) {
        // Ignorer les erreurs si l'index existe déjà
        if (!error.message?.includes("already exists")) {
          console.warn(`⚠️  Erreur lors de la création de l'index ${index.name}:`, error.message);
        }
      }
    }

    console.log("🎉 Migration appliquée avec succès !");

    // Vérification finale
    const finalTable = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = 'user_follows'
    `;

    if (finalTable.length > 0) {
      console.log("📊 Table créée:");
      console.log(`   - ${(finalTable[0] as any).table_name}`);
    }
  } catch (error) {
    console.error("❌ Erreur lors de l'application de la migration:", error);
    process.exit(1);
  }
}

applyUserFollowsMigration();
