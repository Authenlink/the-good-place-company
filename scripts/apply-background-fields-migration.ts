import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";

// Charger les variables d'environnement
config({ path: `${process.cwd()}/.env` });

async function applyBackgroundFieldsMigration() {
  try {
    console.log("🔄 Application de la migration pour les champs de background...");

    const sql = neon(process.env.DATABASE_URL!);

    // Vérifier si les colonnes existent déjà
    console.log("📋 Vérification de l'état actuel des tables...");

    // Vérifier pour events
    const eventsColumnsResult = await sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'events'
      AND table_schema = 'public'
      AND column_name IN ('cover_image', 'background_type', 'background_image_index', 'background_gradient')
    `;

    const existingEventsColumns = eventsColumnsResult.map(
      (row) => (row as any).column_name
    );
    console.log("Colonnes existantes dans events:", existingEventsColumns);

    // Vérifier pour users
    const usersColumnsResult = await sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'users'
      AND table_schema = 'public'
      AND column_name IN ('background_type', 'background_gradient')
    `;

    const existingUsersColumns = usersColumnsResult.map(
      (row) => (row as any).column_name
    );
    console.log("Colonnes existantes dans users:", existingUsersColumns);

    // Vérifier pour companies
    const companiesColumnsResult = await sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'companies'
      AND table_schema = 'public'
      AND column_name IN ('background_type', 'background_gradient')
    `;

    const existingCompaniesColumns = companiesColumnsResult.map(
      (row) => (row as any).column_name
    );
    console.log("Colonnes existantes dans companies:", existingCompaniesColumns);

    // Appliquer les migrations pour events
    if (!existingEventsColumns.includes("cover_image")) {
      console.log("➕ Ajout de cover_image à events...");
      await sql`ALTER TABLE events ADD COLUMN cover_image text`;
      console.log("✅ Colonne cover_image ajoutée à events");
    }

    if (!existingEventsColumns.includes("background_type")) {
      console.log("➕ Ajout de background_type à events...");
      await sql`ALTER TABLE events ADD COLUMN background_type text`;
      console.log("✅ Colonne background_type ajoutée à events");
    }

    if (!existingEventsColumns.includes("background_image_index")) {
      console.log("➕ Ajout de background_image_index à events...");
      await sql`ALTER TABLE events ADD COLUMN background_image_index integer`;
      console.log("✅ Colonne background_image_index ajoutée à events");
    }

    if (!existingEventsColumns.includes("background_gradient")) {
      console.log("➕ Ajout de background_gradient à events...");
      await sql`ALTER TABLE events ADD COLUMN background_gradient jsonb`;
      console.log("✅ Colonne background_gradient ajoutée à events");
    }

    // Appliquer les migrations pour users
    if (!existingUsersColumns.includes("background_type")) {
      console.log("➕ Ajout de background_type à users...");
      await sql`ALTER TABLE users ADD COLUMN background_type text`;
      console.log("✅ Colonne background_type ajoutée à users");
    }

    if (!existingUsersColumns.includes("background_gradient")) {
      console.log("➕ Ajout de background_gradient à users...");
      await sql`ALTER TABLE users ADD COLUMN background_gradient jsonb`;
      console.log("✅ Colonne background_gradient ajoutée à users");
    }

    // Appliquer les migrations pour companies
    if (!existingCompaniesColumns.includes("background_type")) {
      console.log("➕ Ajout de background_type à companies...");
      await sql`ALTER TABLE companies ADD COLUMN background_type text`;
      console.log("✅ Colonne background_type ajoutée à companies");
    }

    if (!existingCompaniesColumns.includes("background_gradient")) {
      console.log("➕ Ajout de background_gradient à companies...");
      await sql`ALTER TABLE companies ADD COLUMN background_gradient jsonb`;
      console.log("✅ Colonne background_gradient ajoutée à companies");
    }

    console.log("🎉 Toutes les migrations ont été appliquées avec succès !");

    // Vérification finale
    const finalEventsColumns = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'events'
      AND table_schema = 'public'
      AND column_name IN ('cover_image', 'background_type', 'background_image_index', 'background_gradient')
      ORDER BY ordinal_position
    `;

    console.log("📊 État final des colonnes background dans events:");
    finalEventsColumns.forEach((row: any) => {
      console.log(
        `   - ${row.column_name} (${row.data_type}) ${
          row.is_nullable === "NO" ? "NOT NULL" : "NULL"
        }`
      );
    });
  } catch (error) {
    console.error("❌ Erreur lors de l'application des migrations:", error);
    process.exit(1);
  }
}

applyBackgroundFieldsMigration();
