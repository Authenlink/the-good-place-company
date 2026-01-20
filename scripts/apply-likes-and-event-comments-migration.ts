import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
import { readFileSync } from "fs";
import { join } from "path";

// Charger les variables d'environnement
config({ path: `${process.cwd()}/.env` });

async function applyLikesAndEventCommentsMigration() {
  try {
    console.log("🔄 Application de la migration pour likes et event_comments...");

    const sql = neon(process.env.DATABASE_URL!);

    // Vérifier si les tables existent déjà
    console.log("📋 Vérification de l'état actuel des tables...");

    const tablesResult = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('post_likes', 'event_likes', 'event_comments')
    `;

    const existingTables = tablesResult.map((row) => (row as any).table_name);
    console.log("Tables existantes:", existingTables);

    // Lire le fichier SQL de migration
    const migrationPath = join(process.cwd(), "drizzle", "0018_add_likes_and_event_comments.sql");
    const migrationSQL = readFileSync(migrationPath, "utf-8");

    // Appliquer la migration si les tables n'existent pas
    if (!existingTables.includes("post_likes")) {
      console.log("➕ Création de la table post_likes...");
      await sql`
        CREATE TABLE IF NOT EXISTS "post_likes" (
          "id" SERIAL PRIMARY KEY,
          "post_id" INTEGER NOT NULL REFERENCES "posts"("id") ON DELETE CASCADE,
          "user_id" INTEGER REFERENCES "users"("id") ON DELETE CASCADE,
          "company_id" INTEGER REFERENCES "companies"("id") ON DELETE CASCADE,
          "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
          CONSTRAINT "post_likes_unique" UNIQUE("post_id", "user_id", "company_id")
        )
      `;
      console.log("✅ Table post_likes créée");
    } else {
      console.log("ℹ️  La table post_likes existe déjà");
    }

    if (!existingTables.includes("event_likes")) {
      console.log("➕ Création de la table event_likes...");
      await sql`
        CREATE TABLE IF NOT EXISTS "event_likes" (
          "id" SERIAL PRIMARY KEY,
          "event_id" INTEGER NOT NULL REFERENCES "events"("id") ON DELETE CASCADE,
          "user_id" INTEGER REFERENCES "users"("id") ON DELETE CASCADE,
          "company_id" INTEGER REFERENCES "companies"("id") ON DELETE CASCADE,
          "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
          CONSTRAINT "event_likes_unique" UNIQUE("event_id", "user_id", "company_id")
        )
      `;
      console.log("✅ Table event_likes créée");
    } else {
      console.log("ℹ️  La table event_likes existe déjà");
    }

    if (!existingTables.includes("event_comments")) {
      console.log("➕ Création de la table event_comments...");
      await sql`
        CREATE TABLE IF NOT EXISTS "event_comments" (
          "id" SERIAL PRIMARY KEY,
          "content" TEXT NOT NULL,
          "event_id" INTEGER NOT NULL REFERENCES "events"("id") ON DELETE CASCADE,
          "user_id" INTEGER REFERENCES "users"("id") ON DELETE CASCADE,
          "company_id" INTEGER REFERENCES "companies"("id") ON DELETE CASCADE,
          "parent_id" INTEGER REFERENCES "event_comments"("id") ON DELETE CASCADE,
          "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
          "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL
        )
      `;
      console.log("✅ Table event_comments créée");
    } else {
      console.log("ℹ️  La table event_comments existe déjà");
    }

    // Créer les index
    console.log("📊 Création des index...");
    
    const indexes = [
      { name: "post_likes_post_id_idx", table: "post_likes", column: "post_id" },
      { name: "post_likes_user_id_idx", table: "post_likes", column: "user_id" },
      { name: "post_likes_company_id_idx", table: "post_likes", column: "company_id" },
      { name: "event_likes_event_id_idx", table: "event_likes", column: "event_id" },
      { name: "event_likes_user_id_idx", table: "event_likes", column: "user_id" },
      { name: "event_likes_company_id_idx", table: "event_likes", column: "company_id" },
      { name: "event_comments_event_id_idx", table: "event_comments", column: "event_id" },
      { name: "event_comments_user_id_idx", table: "event_comments", column: "user_id" },
      { name: "event_comments_company_id_idx", table: "event_comments", column: "company_id" },
      { name: "event_comments_parent_id_idx", table: "event_comments", column: "parent_id" },
      { name: "event_comments_created_at_idx", table: "event_comments", column: "created_at" },
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
      AND table_name IN ('post_likes', 'event_likes', 'event_comments')
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

applyLikesAndEventCommentsMigration();
