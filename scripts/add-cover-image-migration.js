const { neon } = require("@neondatabase/serverless");
require("dotenv").config({ path: `${process.cwd()}/.env` });
require("dotenv").config({
  path: `${process.cwd()}/.env.local`,
  override: true,
});

async function applyCoverImageMigration() {
  try {
    console.log("🔄 Application de la migration cover_image...");

    const sql = neon(process.env.DATABASE_URL);

    console.log("📋 Vérification de l'état de la table events...");

    // Vérifier si la colonne cover_image existe déjà dans events
    const eventsColumnsResult = await sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'events'
      AND table_schema = 'public'
      AND column_name = 'cover_image'
    `;

    if (eventsColumnsResult.length > 0) {
      console.log("✅ La colonne cover_image existe déjà dans la table events");
      return;
    }

    console.log("➕ Ajout de la colonne cover_image à la table events...");
    await sql`ALTER TABLE "events" ADD COLUMN "cover_image" text`;
    console.log("✅ Colonne cover_image ajoutée avec succès à la table events");

  } catch (error) {
    console.error("❌ Erreur lors de l'application de la migration:", error);
    process.exit(1);
  }
}

applyCoverImageMigration();