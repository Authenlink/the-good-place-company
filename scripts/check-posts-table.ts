import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";

// Charger les variables d'environnement
config({ path: `${process.cwd()}/.env` });

async function checkPostsTable() {
  try {
    console.log("🔄 Vérification de la table posts...");

    // Créer une connexion directe avec Neon
    const sql = neon(process.env.DATABASE_URL!);

    // Vérifier la structure de la table posts
    const columnsResult = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'posts'
      AND table_schema = 'public'
      ORDER BY ordinal_position
    `;

    console.log("📊 Colonnes de la table posts:");
    if (columnsResult.length === 0) {
      console.log("   Aucune colonne trouvée");
    } else {
      columnsResult.forEach((row: any) => {
        console.log(
          `   - ${row.column_name} (${row.data_type}) ${
            row.is_nullable === "NO" ? "NOT NULL" : "NULL"
          }`
        );
      });
    }

    // Tester une requête simple sur posts
    const postsCount = await sql`SELECT COUNT(*) as count FROM posts`;
    console.log(`📈 Nombre de posts dans la table: ${postsCount[0].count}`);

    console.log("🎉 Vérification terminée !");
  } catch (error) {
    console.error("❌ Erreur:", error);
    process.exit(1);
  }
}

checkPostsTable();
