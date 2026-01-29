import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";

// Charger les variables d'environnement
config({ path: `${process.cwd()}/.env` });

async function applyUserCompanyMembershipsMigration() {
  try {
    console.log(
      "🔄 Application de la migration pour user_company_memberships...",
    );

    const sql = neon(process.env.DATABASE_URL!);

    // Vérifier si la table existe déjà
    console.log("📋 Vérification de l'état actuel de la table...");

    const tablesResult = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = 'user_company_memberships'
    `;

    const tableExists = tablesResult.length > 0;
    console.log("Table user_company_memberships existe:", tableExists);

    // Appliquer la migration si la table n'existe pas
    if (!tableExists) {
      console.log("➕ Création de la table user_company_memberships...");

      try {
        // Créer la table
        await sql`
          CREATE TABLE IF NOT EXISTS "user_company_memberships" (
            "id" SERIAL PRIMARY KEY,
            "user_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
            "company_id" INTEGER NOT NULL REFERENCES "companies"("id") ON DELETE CASCADE,
            "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
            CONSTRAINT "user_company_memberships_unique" UNIQUE("user_id", "company_id")
          )
        `;
        console.log("✅ Table créée");

        // Créer les index
        console.log("➕ Création des index...");
        await sql`CREATE INDEX IF NOT EXISTS "user_company_memberships_user_id_idx" ON "user_company_memberships"("user_id")`;
        await sql`CREATE INDEX IF NOT EXISTS "user_company_memberships_company_id_idx" ON "user_company_memberships"("company_id")`;
        await sql`CREATE INDEX IF NOT EXISTS "user_company_memberships_created_at_idx" ON "user_company_memberships"("created_at")`;
        console.log("✅ Index créés");

        console.log("✅ Table user_company_memberships créée avec succès");
      } catch (error: any) {
        console.error("❌ Erreur lors de la création:", error.message);
        throw error;
      }
    } else {
      console.log("ℹ️  La table user_company_memberships existe déjà");

      // Vérifier les index
      console.log("📊 Vérification des index...");

      const indexes = [
        "user_company_memberships_user_id_idx",
        "user_company_memberships_company_id_idx",
        "user_company_memberships_created_at_idx",
      ];

      for (const indexName of indexes) {
        try {
          const indexCheck = await sql`
            SELECT indexname
            FROM pg_indexes
            WHERE schemaname = 'public'
            AND indexname = ${indexName}
          `;

          if (indexCheck.length === 0) {
            console.log(
              `⚠️  Index ${indexName} manquant - il devrait être créé par la migration SQL`,
            );
          } else {
            console.log(`✅ Index ${indexName} existe déjà`);
          }
        } catch (error: any) {
          console.warn(
            `⚠️  Erreur lors de la vérification de l'index ${indexName}:`,
            error.message,
          );
        }
      }
    }

    console.log("🎉 Migration appliquée avec succès !");

    // Vérification finale
    const finalTable = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = 'user_company_memberships'
    `;

    if (finalTable.length > 0) {
      console.log("📊 Table créée:");
      console.log(`   - ${(finalTable[0] as any).table_name}`);

      // Afficher les colonnes
      const columns = await sql`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'user_company_memberships'
        AND table_schema = 'public'
        ORDER BY ordinal_position
      `;

      console.log("📋 Colonnes de la table user_company_memberships:");
      columns.forEach((row: any) => {
        console.log(
          `   - ${row.column_name} (${row.data_type}) ${
            row.is_nullable === "NO" ? "NOT NULL" : "NULL"
          }`,
        );
      });

      // Vérifier la contrainte unique
      const constraints = await sql`
        SELECT constraint_name, constraint_type
        FROM information_schema.table_constraints
        WHERE table_name = 'user_company_memberships'
        AND table_schema = 'public'
      `;

      console.log("🔒 Contraintes de la table:");
      constraints.forEach((row: any) => {
        console.log(`   - ${row.constraint_name} (${row.constraint_type})`);
      });
    }
  } catch (error) {
    console.error("❌ Erreur lors de l'application de la migration:", error);
    process.exit(1);
  }
}

applyUserCompanyMembershipsMigration();
