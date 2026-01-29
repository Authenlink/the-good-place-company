import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";

// Charger les variables d'environnement
config({ path: `${process.cwd()}/.env` });

async function applyMissionsMigration() {
  try {
    console.log(
      "🔄 Application de la migration pour ajouter le support des missions multiples...",
    );

    const sql = neon(process.env.DATABASE_URL!);

    // Vérifier si la colonne missions existe déjà
    const missionsColumnCheck = await sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'event_slots'
      AND column_name = 'missions'
    `;

    const missionsColumnExists = missionsColumnCheck.length > 0;
    console.log("Colonne missions existe:", missionsColumnExists);

    if (!missionsColumnExists) {
      console.log("➕ Ajout de la colonne missions...");

      // Ajouter la colonne missions
      await sql`
        ALTER TABLE "event_slots" 
        ADD COLUMN "missions" jsonb NOT NULL DEFAULT '[]'::jsonb
      `;
      console.log("✅ Colonne missions ajoutée");

      // Migrer les données existantes
      console.log("🔄 Migration des données existantes...");
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
    } else {
      console.log("ℹ️  La colonne missions existe déjà");
    }

    console.log("\n🎉 Migration appliquée avec succès !");

    // Vérification finale
    const finalCheck = await sql`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'event_slots'
      AND column_name = 'missions'
    `;

    if (finalCheck.length > 0) {
      console.log("\n📊 Colonne missions:");
      const col = finalCheck[0] as any;
      console.log(`   - Nom: ${col.column_name}`);
      console.log(`   - Type: ${col.data_type}`);
      console.log(`   - Défaut: ${col.column_default}`);
    }
  } catch (error) {
    console.error("❌ Erreur lors de l'application de la migration:", error);
    process.exit(1);
  }
}

applyMissionsMigration();
