import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";

// Charger les variables d'environnement
config({ path: `${process.cwd()}/.env` });

async function testConnection() {
  try {
    console.log("🔄 Test de connexion à la base de données Neon...");
    console.log(
      "🔍 DATABASE_URL:",
      process.env.DATABASE_URL ? "Définie" : "Non définie"
    );

    // Créer une connexion directe avec Neon
    const sql = neon(process.env.DATABASE_URL!);

    // Test basique de connexion
    const result = await sql`SELECT version()`;
    console.log("✅ Connexion réussie !");
    console.log("📊 Version PostgreSQL:", result[0].version);

    // Test d'une requête simple pour lister les tables
    const tablesResult = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;

    console.log("📋 Tables existantes dans la base de données:");
    if (tablesResult.length === 0) {
      console.log("   Aucune table trouvée (base de données vide)");
    } else {
      tablesResult.forEach((row: any) => {
        console.log(`   - ${row.table_name}`);
      });
    }

    console.log("🎉 Test terminé avec succès !");
  } catch (error) {
    console.error("❌ Erreur de connexion:", error);
    console.error(
      "💡 Vérifiez que votre DATABASE_URL est correcte dans le fichier .env"
    );
    process.exit(1);
  }
}

testConnection();
