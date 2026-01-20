import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
import { readFileSync } from "fs";
import { join } from "path";

// Charger les variables d'environnement
config({ path: `${process.cwd()}/.env` });

async function applyCommentLikesMigration() {
  try {
    console.log("🔄 Application de la migration pour comment likes...");

    const sql = neon(process.env.DATABASE_URL!);

    // Vérifier si les tables existent déjà
    console.log("📋 Vérification de l'état actuel des tables...");

    const tablesResult = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('comment_likes', 'event_comment_likes')
    `;

    const existingTables = tablesResult.map((row) => (row as any).table_name);
    console.log("Tables existantes:", existingTables);

    // Lire le fichier SQL de migration
    const migrationPath = join(process.cwd(), "drizzle", "0019_add_comment_likes.sql");
    const migrationSQL = readFileSync(migrationPath, "utf-8");

    // Appliquer la migration si les tables n'existent pas
    if (!existingTables.includes("comment_likes")) {
      console.log("➕ Création de la table comment_likes...");
      await sql`
        CREATE TABLE IF NOT EXISTS "comment_likes" (
          "id" SERIAL PRIMARY KEY,
          "comment_id" INTEGER NOT NULL REFERENCES "comments"("id") ON DELETE CASCADE,
          "user_id" INTEGER REFERENCES "users"("id") ON DELETE CASCADE,
          "company_id" INTEGER REFERENCES "companies"("id") ON DELETE CASCADE,
          "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
          CONSTRAINT "comment_likes_unique" UNIQUE("comment_id", "user_id", "company_id")
        )
      `;
      console.log("✅ Table comment_likes créée");
    } else {
      console.log("ℹ️  La table comment_likes existe déjà");
    }

    if (!existingTables.includes("event_comment_likes")) {
      console.log("➕ Création de la table event_comment_likes...");
      await sql`
        CREATE TABLE IF NOT EXISTS "event_comment_likes" (
          "id" SERIAL PRIMARY KEY,
          "event_comment_id" INTEGER NOT NULL REFERENCES "event_comments"("id") ON DELETE CASCADE,
          "user_id" INTEGER REFERENCES "users"("id") ON DELETE CASCADE,
          "company_id" INTEGER REFERENCES "companies"("id") ON DELETE CASCADE,
          "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
          CONSTRAINT "event_comment_likes_unique" UNIQUE("event_comment_id", "user_id", "company_id")
        )
      `;
      console.log("✅ Table event_comment_likes créée");
    } else {
      console.log("ℹ️  La table event_comment_likes existe déjà");
    }

    // Créer les index
    console.log("📊 Création des index...");
    
    const indexes = [
      { name: "comment_likes_comment_id_idx", table: "comment_likes", column: "comment_id" },
      { name: "comment_likes_user_id_idx", table: "comment_likes", column: "user_id" },
      { name: "comment_likes_company_id_idx", table: "comment_likes", column: "company_id" },
      { name: "event_comment_likes_event_comment_id_idx", table: "event_comment_likes", column: "event_comment_id" },
      { name: "event_comment_likes_user_id_idx", table: "event_comment_likes", column: "user_id" },
      { name: "event_comment_likes_company_id_idx", table: "event_comment_likes", column: "company_id" },
    ];

    for (const index of indexes) {
      try {
        await sql.unsafe(`CREATE INDEX IF NOT EXISTS "${index.name}" ON "${index.table}"("${index.column}")`);
        console.log(`✅ Index ${index.name} créé`);
      } catch (error: any) {
        // Ignorer les erreurs si l'index existe déjà
        if (!error.message?.includes("already exists")) {
          console.warn(`⚠️  Erreur lors de la création de l'index ${index.name}:`, error.message);
        }
      }
    }

    console.log("🎉 Migration appliquée avec succès !");

    // Vérification finale
    const finalTables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('comment_likes', 'event_comment_likes')
      ORDER BY table_name
    `;

    console.log("📊 Tables créées:");
    finalTables.forEach((row: any) => {
      console.log(`   - ${row.table_name}`);
    });
  } catch (error) {
    console.error("❌ Erreur lors de l'application de la migration:", error);
    process.exit(1);
  }
}

applyCommentLikesMigration();
