const { neon } = require("@neondatabase/serverless");
require("dotenv").config();

async function applyMigrations() {
  try {
    console.log("🔄 Application des migrations...");

    const sql = neon(process.env.DATABASE_URL);

    // Migration 1: Ajouter la colonne missions à event_slots
    console.log("\n1️⃣ Application de la migration 0025_add_missions_to_slots.sql...");
    try {
      await sql`
        ALTER TABLE "event_slots" ADD COLUMN IF NOT EXISTS "missions" jsonb NOT NULL DEFAULT '[]'::jsonb
      `;
      console.log("✅ Colonne missions ajoutée");

      // Migrer les données existantes
      await sql`
        UPDATE "event_slots" 
        SET "missions" = jsonb_build_array(
          jsonb_build_object(
            'type', COALESCE("mission_type", 'autre'),
            'description', "mission_description",
            'maxParticipants', COALESCE("max_participants", 10)
          )
        )
        WHERE "missions" = '[]'::jsonb OR "missions" IS NULL
      `;
      console.log("✅ Données migrées");
    } catch (error) {
      if (error.message?.includes("already exists") || error.code === "42701") {
        console.log("ℹ️  La colonne missions existe déjà");
      } else {
        throw error;
      }
    }

    // Migration 2: Ajouter la colonne mission_type à event_slot_participants
    console.log("\n2️⃣ Application de la migration 0026_add_mission_type_to_slot_participants.sql...");
    try {
      await sql`
        ALTER TABLE "event_slot_participants" ADD COLUMN IF NOT EXISTS "mission_type" text
      `;
      console.log("✅ Colonne mission_type ajoutée");

      // Créer l'index composite
      await sql`
        CREATE INDEX IF NOT EXISTS "event_slot_participants_slot_id_mission_type_idx" 
        ON "event_slot_participants" ("slot_id", "mission_type")
      `;
      console.log("✅ Index composite créé");
    } catch (error) {
      if (error.message?.includes("already exists") || error.code === "42701" || error.code === "42P07") {
        console.log("ℹ️  La colonne ou l'index existe déjà");
      } else {
        throw error;
      }
    }

    console.log("\n🎉 Toutes les migrations ont été appliquées avec succès !");
    process.exit(0);
  } catch (error) {
    console.error("❌ Erreur lors de l'application des migrations:", error);
    process.exit(1);
  }
}

applyMigrations();
