import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";

// Charger les variables d'environnement
config({ path: `${process.cwd()}/.env` });

async function applyRecurrenceGroupIdMigration() {
  try {
    console.log("🔄 Application de la migration recurrence_group_id...");

    const sql = neon(process.env.DATABASE_URL!);

    console.log("📋 Vérification de l'état actuel de la table events...");

    // Vérifier si la colonne recurrence_group_id existe déjà
    const columnsResult = await sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'events'
      AND table_schema = 'public'
      AND column_name = 'recurrence_group_id'
    `;

    if (columnsResult.length > 0) {
      console.log("✅ La colonne recurrence_group_id existe déjà");
      
      // Vérifier si la contrainte de clé étrangère existe
      const fkResult = await sql`
        SELECT constraint_name
        FROM information_schema.table_constraints
        WHERE table_name = 'events'
        AND constraint_type = 'FOREIGN KEY'
        AND constraint_name = 'events_recurrence_group_id_fkey'
      `;

      if (fkResult.length > 0) {
        console.log("✅ La contrainte de clé étrangère existe déjà");
        console.log("🎉 Migration déjà appliquée !");
        return;
      } else {
        console.log("⚠️  La colonne existe mais pas la contrainte, ajout de la contrainte...");
        await sql`
          ALTER TABLE events ADD CONSTRAINT events_recurrence_group_id_fkey 
          FOREIGN KEY (recurrence_group_id) REFERENCES events(id) ON DELETE CASCADE
        `;
        console.log("✅ Contrainte de clé étrangère ajoutée");
        console.log("🎉 Migration appliquée avec succès !");
        return;
      }
    }

    console.log("➕ Ajout de la colonne recurrence_group_id...");
    await sql`ALTER TABLE events ADD COLUMN recurrence_group_id integer`;
    console.log("✅ Colonne recurrence_group_id ajoutée");

    console.log("🔗 Ajout de la contrainte de clé étrangère...");
    await sql`
      ALTER TABLE events ADD CONSTRAINT events_recurrence_group_id_fkey 
      FOREIGN KEY (recurrence_group_id) REFERENCES events(id) ON DELETE CASCADE
    `;
    console.log("✅ Contrainte de clé étrangère ajoutée");

    console.log("🎉 Migration appliquée avec succès !");

    // Vérification finale
    const finalColumnsResult = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'events'
      AND table_schema = 'public'
      AND column_name = 'recurrence_group_id'
    `;

    if (finalColumnsResult.length > 0) {
      const column = finalColumnsResult[0] as any;
      console.log("📊 État final de la colonne recurrence_group_id:");
      console.log(
        `   - ${column.column_name} (${column.data_type}) ${
          column.is_nullable === "NO" ? "NOT NULL" : "NULL"
        }`
      );
    }
  } catch (error) {
    console.error("❌ Erreur lors de l'application de la migration:", error);
    process.exit(1);
  }
}

applyRecurrenceGroupIdMigration();
