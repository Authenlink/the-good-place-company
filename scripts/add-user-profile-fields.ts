import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";

// Charger les variables d'environnement
config({ path: `${process.cwd()}/.env` });

async function addUserProfileFields() {
  try {
    console.log("🔄 Ajout des champs de profil utilisateur...");

    const sql = neon(process.env.DATABASE_URL!);

    console.log(
      "📋 Vérification des colonnes existantes dans la table users..."
    );

    // Vérifier si les colonnes existent déjà
    const columnsResult = await sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'users'
      AND table_schema = 'public'
      AND column_name IN ('bio', 'location', 'website', 'banner')
    `;

    const existingColumns = columnsResult.map(
      (row) => (row as any).column_name
    );
    console.log("Colonnes existantes:", existingColumns);

    // Appliquer les migrations manuellement
    if (!existingColumns.includes("bio")) {
      console.log("➕ Ajout de la colonne bio...");
      await sql`ALTER TABLE "users" ADD COLUMN "bio" text`;
      console.log("✅ Colonne bio ajoutée");
    }

    if (!existingColumns.includes("location")) {
      console.log("➕ Ajout de la colonne location...");
      await sql`ALTER TABLE "users" ADD COLUMN "location" text`;
      console.log("✅ Colonne location ajoutée");
    }

    if (!existingColumns.includes("website")) {
      console.log("➕ Ajout de la colonne website...");
      await sql`ALTER TABLE "users" ADD COLUMN "website" text`;
      console.log("✅ Colonne website ajoutée");
    }

    if (!existingColumns.includes("banner")) {
      console.log("➕ Ajout de la colonne banner...");
      await sql`ALTER TABLE "users" ADD COLUMN "banner" text`;
      console.log("✅ Colonne banner ajoutée");
    }

    console.log(
      "🎉 Tous les champs de profil utilisateur ont été ajoutés avec succès !"
    );

    // Vérification finale
    const finalColumnsResult = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'users'
      AND table_schema = 'public'
      AND column_name IN ('bio', 'location', 'website', 'banner', 'name', 'email', 'image')
      ORDER BY column_name
    `;

    console.log("📊 État final des colonnes de profil dans la table users:");
    finalColumnsResult.forEach((row: any) => {
      console.log(
        `   - ${row.column_name} (${row.data_type}) ${
          row.is_nullable === "NO" ? "NOT NULL" : "NULL"
        }`
      );
    });
  } catch (error) {
    console.error("❌ Erreur lors de l'ajout des champs de profil:", error);
    process.exit(1);
  }
}

addUserProfileFields();
