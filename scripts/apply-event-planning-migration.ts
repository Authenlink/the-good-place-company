import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
import * as fs from "fs";
import * as path from "path";

// Charger les variables d'environnement
config({ path: `${process.cwd()}/.env` });

async function applyEventPlanningMigration() {
  try {
    console.log(
      "🔄 Application de la migration pour le système de planning des événements...",
    );

    const sql = neon(process.env.DATABASE_URL!);

    // Lire le fichier SQL de migration
    const migrationPath = path.join(
      process.cwd(),
      "drizzle",
      "0024_add_event_planning.sql",
    );
    const migrationSQL = fs.readFileSync(migrationPath, "utf-8");

    console.log("📋 Vérification de l'état actuel...");

    // Vérifier si la colonne slot_id existe déjà dans event_participants
    const slotIdColumnCheck = await sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'event_participants'
      AND column_name = 'slot_id'
    `;

    const slotIdColumnExists = slotIdColumnCheck.length > 0;
    console.log("Colonne slot_id dans event_participants existe:", slotIdColumnExists);

    // Vérifier si la table event_slots existe
    const eventSlotsTableCheck = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = 'event_slots'
    `;

    const eventSlotsTableExists = eventSlotsTableCheck.length > 0;
    console.log("Table event_slots existe:", eventSlotsTableExists);

    // Vérifier si la table event_slot_participants existe
    const eventSlotParticipantsTableCheck = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = 'event_slot_participants'
    `;

    const eventSlotParticipantsTableExists =
      eventSlotParticipantsTableCheck.length > 0;
    console.log(
      "Table event_slot_participants existe:",
      eventSlotParticipantsTableExists,
    );

    // Appliquer la migration si nécessaire
    if (
      !slotIdColumnExists ||
      !eventSlotsTableExists ||
      !eventSlotParticipantsTableExists
    ) {
      console.log("➕ Application de la migration SQL...");

      try {
        // Créer event_slots d'abord
        if (!eventSlotsTableExists) {
          console.log("📦 Création de la table event_slots...");
          await sql`
            CREATE TABLE IF NOT EXISTS "event_slots" (
              "id" serial PRIMARY KEY NOT NULL,
              "event_id" integer NOT NULL REFERENCES "events"("id") ON DELETE CASCADE,
              "start_time" timestamp NOT NULL,
              "end_time" timestamp NOT NULL,
              "max_participants" integer NOT NULL,
              "mission_type" text NOT NULL,
              "mission_description" text,
              "created_at" timestamp DEFAULT now() NOT NULL,
              "updated_at" timestamp DEFAULT now() NOT NULL
            )
          `;
          console.log("✅ Table event_slots créée");
        }

        // Créer event_slot_participants
        if (!eventSlotParticipantsTableExists) {
          console.log("📦 Création de la table event_slot_participants...");
          await sql`
            CREATE TABLE IF NOT EXISTS "event_slot_participants" (
              "id" serial PRIMARY KEY NOT NULL,
              "slot_id" integer NOT NULL REFERENCES "event_slots"("id") ON DELETE CASCADE,
              "participant_id" integer REFERENCES "event_participants"("id") ON DELETE CASCADE,
              "prefilled_name" text,
              "created_at" timestamp DEFAULT now() NOT NULL
            )
          `;
          console.log("✅ Table event_slot_participants créée");
        }

        // Ajouter slot_id à event_participants
        if (!slotIdColumnExists) {
          console.log("📦 Ajout de la colonne slot_id à event_participants...");
          await sql`
            ALTER TABLE "event_participants" 
            ADD COLUMN IF NOT EXISTS "slot_id" integer REFERENCES "event_slots"("id") ON DELETE SET NULL
          `;
          console.log("✅ Colonne slot_id ajoutée");
        }

        // Créer les index
        console.log("📦 Création des index...");
        await sql`CREATE INDEX IF NOT EXISTS "event_slots_event_id_idx" ON "event_slots" ("event_id")`;
        await sql`CREATE INDEX IF NOT EXISTS "event_slots_start_time_idx" ON "event_slots" ("start_time")`;
        await sql`CREATE INDEX IF NOT EXISTS "event_slot_participants_slot_id_idx" ON "event_slot_participants" ("slot_id")`;
        await sql`CREATE INDEX IF NOT EXISTS "event_slot_participants_participant_id_idx" ON "event_slot_participants" ("participant_id")`;
        await sql`CREATE INDEX IF NOT EXISTS "event_participants_slot_id_idx" ON "event_participants" ("slot_id")`;
        console.log("✅ Index créés");

        console.log("✅ Migration SQL appliquée");
      } catch (error: any) {
        console.error("❌ Erreur lors de l'application:", error.message);
        throw error;
      }
    } else {
      console.log("ℹ️  Toutes les tables et colonnes existent déjà");
      
      // Vérifier et créer les index manquants même si les tables existent
      console.log("📦 Vérification des index...");
      const indexesToCreate = [
        { name: "event_slots_event_id_idx", sql: `CREATE INDEX IF NOT EXISTS "event_slots_event_id_idx" ON "event_slots" ("event_id")` },
        { name: "event_slots_start_time_idx", sql: `CREATE INDEX IF NOT EXISTS "event_slots_start_time_idx" ON "event_slots" ("start_time")` },
        { name: "event_slot_participants_slot_id_idx", sql: `CREATE INDEX IF NOT EXISTS "event_slot_participants_slot_id_idx" ON "event_slot_participants" ("slot_id")` },
        { name: "event_slot_participants_participant_id_idx", sql: `CREATE INDEX IF NOT EXISTS "event_slot_participants_participant_id_idx" ON "event_slot_participants" ("participant_id")` },
        { name: "event_participants_slot_id_idx", sql: `CREATE INDEX IF NOT EXISTS "event_participants_slot_id_idx" ON "event_participants" ("slot_id")` },
      ];

      for (const index of indexesToCreate) {
        const indexCheck = await sql`
          SELECT indexname
          FROM pg_indexes
          WHERE schemaname = 'public'
          AND indexname = ${index.name}
        `;

        if (indexCheck.length === 0) {
          console.log(`   ➕ Création de l'index ${index.name}...`);
          await sql.unsafe(index.sql);
          console.log(`   ✅ Index ${index.name} créé`);
        }
      }
    }

    // Vérification finale
    console.log("\n📊 Vérification finale...");

    // Vérifier event_slots
    if (eventSlotsTableExists) {
      const eventSlotsColumns = await sql`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'event_slots'
        AND table_schema = 'public'
        ORDER BY ordinal_position
      `;

      console.log("\n📋 Colonnes de la table event_slots:");
      eventSlotsColumns.forEach((row: any) => {
        console.log(
          `   - ${row.column_name} (${row.data_type}) ${
            row.is_nullable === "NO" ? "NOT NULL" : "NULL"
          }`,
        );
      });
    }

    // Vérifier event_slot_participants
    if (eventSlotParticipantsTableExists) {
      const eventSlotParticipantsColumns = await sql`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'event_slot_participants'
        AND table_schema = 'public'
        ORDER BY ordinal_position
      `;

      console.log("\n📋 Colonnes de la table event_slot_participants:");
      eventSlotParticipantsColumns.forEach((row: any) => {
        console.log(
          `   - ${row.column_name} (${row.data_type}) ${
            row.is_nullable === "NO" ? "NOT NULL" : "NULL"
          }`,
        );
      });
    }

    // Vérifier les index
    const indexes = [
      "event_slots_event_id_idx",
      "event_slots_start_time_idx",
      "event_slot_participants_slot_id_idx",
      "event_slot_participants_participant_id_idx",
      "event_participants_slot_id_idx",
    ];

    console.log("\n📊 Vérification des index...");
    for (const indexName of indexes) {
      const indexCheck = await sql`
        SELECT indexname
        FROM pg_indexes
        WHERE schemaname = 'public'
        AND indexname = ${indexName}
      `;

      if (indexCheck.length > 0) {
        console.log(`   ✅ ${indexName}`);
      } else {
        console.log(`   ⚠️  ${indexName} manquant`);
      }
    }

    console.log("\n🎉 Migration appliquée avec succès !");
  } catch (error) {
    console.error("❌ Erreur lors de l'application de la migration:", error);
    process.exit(1);
  }
}

applyEventPlanningMigration();
