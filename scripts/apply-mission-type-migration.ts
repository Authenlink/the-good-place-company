import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
import { readFileSync } from "fs";
import { join } from "path";

// Charger les variables d'environnement
config({ path: `${process.cwd()}/.env` });

async function applyMissionTypeMigration() {
  try {
    console.log(
      "🔄 Application de la migration pour ajouter mission_type à event_slot_participants...",
    );

    const sql = neon(process.env.DATABASE_URL!);

    // Vérifier si la colonne mission_type existe déjà
    const missionTypeColumnCheck = await sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'event_slot_participants'
      AND column_name = 'mission_type'
    `;

    const missionTypeColumnExists = missionTypeColumnCheck.length > 0;
    console.log("Colonne mission_type existe:", missionTypeColumnExists);

    if (!missionTypeColumnExists) {
      console.log("➕ Ajout de la colonne mission_type...");

      // Ajouter la colonne mission_type
      await sql`
        ALTER TABLE "event_slot_participants" 
        ADD COLUMN "mission_type" text
      `;
      console.log("✅ Colonne mission_type ajoutée");
    } else {
      console.log("ℹ️  La colonne mission_type existe déjà");
    }

    // Vérifier si l'index existe déjà
    const indexCheck = await sql`
      SELECT indexname
      FROM pg_indexes
      WHERE schemaname = 'public'
      AND tablename = 'event_slot_participants'
      AND indexname = 'event_slot_participants_slot_id_mission_type_idx'
    `;

    const indexExists = indexCheck.length > 0;
    console.log("Index composite existe:", indexExists);

    if (!indexExists) {
      console.log("➕ Création de l'index composite...");
      await sql`
        CREATE INDEX "event_slot_participants_slot_id_mission_type_idx" 
        ON "event_slot_participants" ("slot_id", "mission_type")
      `;
      console.log("✅ Index composite créé");
    } else {
      console.log("ℹ️  L'index composite existe déjà");
    }

    console.log("\n🎉 Migration appliquée avec succès !");

    // Vérification finale
    const finalCheck = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'event_slot_participants'
      AND column_name = 'mission_type'
    `;

    if (finalCheck.length > 0) {
      console.log("\n📊 Colonne mission_type:");
      const col = finalCheck[0] as any;
      console.log(`   - Nom: ${col.column_name}`);
      console.log(`   - Type: ${col.data_type}`);
      console.log(`   - Nullable: ${col.is_nullable}`);
    }
  } catch (error) {
    console.error("❌ Erreur lors de l'application de la migration:", error);
    process.exit(1);
  }
}

applyMissionTypeMigration();
