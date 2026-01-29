import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";

// Charger les variables d'environnement
config({ path: `${process.cwd()}/.env` });

async function createIndexes() {
  try {
    console.log("🔄 Création des index pour le système de planning...");

    const sql = neon(process.env.DATABASE_URL!);

    const indexes = [
      {
        name: "event_slots_event_id_idx",
        sql: `CREATE INDEX IF NOT EXISTS "event_slots_event_id_idx" ON "event_slots" ("event_id")`,
      },
      {
        name: "event_slots_start_time_idx",
        sql: `CREATE INDEX IF NOT EXISTS "event_slots_start_time_idx" ON "event_slots" ("start_time")`,
      },
      {
        name: "event_slot_participants_slot_id_idx",
        sql: `CREATE INDEX IF NOT EXISTS "event_slot_participants_slot_id_idx" ON "event_slot_participants" ("slot_id")`,
      },
      {
        name: "event_slot_participants_participant_id_idx",
        sql: `CREATE INDEX IF NOT EXISTS "event_slot_participants_participant_id_idx" ON "event_slot_participants" ("participant_id")`,
      },
      {
        name: "event_participants_slot_id_idx",
        sql: `CREATE INDEX IF NOT EXISTS "event_participants_slot_id_idx" ON "event_participants" ("slot_id")`,
      },
    ];

    for (const index of indexes) {
      // Vérifier si l'index existe
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
      } else {
        console.log(`   ✅ Index ${index.name} existe déjà`);
      }
    }

    console.log("\n🎉 Tous les index ont été créés avec succès !");
  } catch (error) {
    console.error("❌ Erreur lors de la création des index:", error);
    process.exit(1);
  }
}

createIndexes();
