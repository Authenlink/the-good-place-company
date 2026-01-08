// Script pour ajouter la colonne images manuellement
const { Client } = require("pg");

// Configuration de la base de données (à adapter selon votre setup)
const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function addImagesColumn() {
  try {
    await client.connect();
    console.log("🔄 Connexion à la base de données...");

    // Vérifier si la colonne images existe déjà
    const checkResult = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'posts'
      AND table_schema = 'public'
      AND column_name = 'images'
    `);

    if (checkResult.rows.length > 0) {
      console.log("✅ La colonne images existe déjà");
    } else {
      // Ajouter la colonne images
      await client.query(`
        ALTER TABLE posts ADD COLUMN images jsonb DEFAULT '[]'::jsonb
      `);
      console.log("✅ Colonne images ajoutée avec succès");
    }

    // Vérifier si la colonne company_id existe
    const checkCompanyResult = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'posts'
      AND table_schema = 'public'
      AND column_name = 'company_id'
    `);

    if (checkCompanyResult.rows.length === 0) {
      await client.query(`
        ALTER TABLE posts ADD COLUMN company_id integer REFERENCES companies(id)
      `);
      console.log("✅ Colonne company_id ajoutée avec succès");
    }

    // Vérifier si la colonne updated_at existe
    const checkUpdatedResult = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'posts'
      AND table_schema = 'public'
      AND column_name = 'updated_at'
    `);

    if (checkUpdatedResult.rows.length === 0) {
      await client.query(`
        ALTER TABLE posts ADD COLUMN updated_at timestamp DEFAULT now()
      `);
      console.log("✅ Colonne updated_at ajoutée avec succès");
    }
  } catch (error) {
    console.error("❌ Erreur:", error);
  } finally {
    await client.end();
  }
}

addImagesColumn();
