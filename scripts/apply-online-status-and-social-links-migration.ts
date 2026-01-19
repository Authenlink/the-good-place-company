import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";

// Charger les variables d'environnement
config({ path: `${process.cwd()}/.env` });

async function applyOnlineStatusAndSocialLinksMigration() {
  try {
    console.log("🔄 Application de la migration pour présence en ligne et réseaux sociaux...");

    const sql = neon(process.env.DATABASE_URL!);

    // Vérifier si les colonnes existent déjà
    console.log("📋 Vérification de l'état actuel des tables...");

    // Vérifier pour users
    const usersColumnsResult = await sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'users'
      AND table_schema = 'public'
      AND column_name IN ('is_online', 'instagram_url', 'tiktok_url', 'linkedin_url')
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
      AND column_name IN ('is_online', 'instagram_url', 'tiktok_url', 'linkedin_url')
    `;

    const existingCompaniesColumns = companiesColumnsResult.map(
      (row) => (row as any).column_name
    );
    console.log("Colonnes existantes dans companies:", existingCompaniesColumns);

    // Appliquer les migrations pour users
    if (!existingUsersColumns.includes("is_online")) {
      console.log("➕ Ajout de is_online à users...");
      await sql`ALTER TABLE users ADD COLUMN is_online boolean DEFAULT false`;
      console.log("✅ Colonne is_online ajoutée à users");
    }

    if (!existingUsersColumns.includes("instagram_url")) {
      console.log("➕ Ajout de instagram_url à users...");
      await sql`ALTER TABLE users ADD COLUMN instagram_url text`;
      console.log("✅ Colonne instagram_url ajoutée à users");
    }

    if (!existingUsersColumns.includes("tiktok_url")) {
      console.log("➕ Ajout de tiktok_url à users...");
      await sql`ALTER TABLE users ADD COLUMN tiktok_url text`;
      console.log("✅ Colonne tiktok_url ajoutée à users");
    }

    if (!existingUsersColumns.includes("linkedin_url")) {
      console.log("➕ Ajout de linkedin_url à users...");
      await sql`ALTER TABLE users ADD COLUMN linkedin_url text`;
      console.log("✅ Colonne linkedin_url ajoutée à users");
    }

    // Appliquer les migrations pour companies
    if (!existingCompaniesColumns.includes("is_online")) {
      console.log("➕ Ajout de is_online à companies...");
      await sql`ALTER TABLE companies ADD COLUMN is_online boolean DEFAULT false`;
      console.log("✅ Colonne is_online ajoutée à companies");
    }

    if (!existingCompaniesColumns.includes("instagram_url")) {
      console.log("➕ Ajout de instagram_url à companies...");
      await sql`ALTER TABLE companies ADD COLUMN instagram_url text`;
      console.log("✅ Colonne instagram_url ajoutée à companies");
    }

    if (!existingCompaniesColumns.includes("tiktok_url")) {
      console.log("➕ Ajout de tiktok_url à companies...");
      await sql`ALTER TABLE companies ADD COLUMN tiktok_url text`;
      console.log("✅ Colonne tiktok_url ajoutée à companies");
    }

    if (!existingCompaniesColumns.includes("linkedin_url")) {
      console.log("➕ Ajout de linkedin_url à companies...");
      await sql`ALTER TABLE companies ADD COLUMN linkedin_url text`;
      console.log("✅ Colonne linkedin_url ajoutée à companies");
    }

    console.log("🎉 Toutes les migrations ont été appliquées avec succès !");

    // Vérification finale
    const finalUsersColumns = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'users'
      AND table_schema = 'public'
      AND column_name IN ('is_online', 'instagram_url', 'tiktok_url', 'linkedin_url')
      ORDER BY ordinal_position
    `;

    console.log("📊 État final des colonnes dans users:");
    finalUsersColumns.forEach((row: any) => {
      console.log(
        `   - ${row.column_name} (${row.data_type}) ${
          row.is_nullable === "NO" ? "NOT NULL" : "NULL"
        }${row.column_default ? ` DEFAULT ${row.column_default}` : ""}`
      );
    });

    const finalCompaniesColumns = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'companies'
      AND table_schema = 'public'
      AND column_name IN ('is_online', 'instagram_url', 'tiktok_url', 'linkedin_url')
      ORDER BY ordinal_position
    `;

    console.log("📊 État final des colonnes dans companies:");
    finalCompaniesColumns.forEach((row: any) => {
      console.log(
        `   - ${row.column_name} (${row.data_type}) ${
          row.is_nullable === "NO" ? "NOT NULL" : "NULL"
        }${row.column_default ? ` DEFAULT ${row.column_default}` : ""}`
      );
    });
  } catch (error) {
    console.error("❌ Erreur lors de l'application des migrations:", error);
    process.exit(1);
  }
}

applyOnlineStatusAndSocialLinksMigration();
