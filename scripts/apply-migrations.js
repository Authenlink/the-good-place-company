const { neon } = require("@neondatabase/serverless");
require("dotenv").config({ path: `${process.cwd()}/.env` });
require("dotenv").config({
  path: `${process.cwd()}/.env.local`,
  override: true,
});

async function applyMigrations() {
  try {
    console.log("🔄 Application des migrations manuelles...");

    const sql = neon(process.env.DATABASE_URL);

    console.log("📋 Vérification de l'état actuel de la table posts...");

    // Vérifier si les colonnes existent déjà
    const columnsResult = await sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'posts'
      AND table_schema = 'public'
      AND column_name IN ('company_id', 'images', 'updated_at')
    `;

    const existingColumns = columnsResult.map((row) => row.column_name);
    console.log("Colonnes existantes:", existingColumns);

    // Appliquer les migrations manuellement
    if (!existingColumns.includes("company_id")) {
      console.log("➕ Ajout de la colonne company_id...");
      await sql`ALTER TABLE "posts" ADD COLUMN "company_id" integer REFERENCES "companies"("id")`;
      console.log("✅ Colonne company_id ajoutée");
    }

    if (!existingColumns.includes("images")) {
      console.log("➕ Ajout de la colonne images...");
      await sql`ALTER TABLE "posts" ADD COLUMN "images" jsonb DEFAULT '[]'::jsonb`;
      console.log("✅ Colonne images ajoutée");
    }

    if (!existingColumns.includes("updated_at")) {
      console.log("➕ Ajout de la colonne updated_at...");
      await sql`ALTER TABLE "posts" ADD COLUMN "updated_at" timestamp DEFAULT now()`;
      console.log("✅ Colonne updated_at ajoutée");
    }

    console.log("🎉 Migrations appliquées avec succès !");
  } catch (error) {
    console.error("❌ Erreur:", error);
    process.exit(1);
  }
}

applyMigrations();
