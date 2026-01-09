import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";

// Charger les variables d'environnement
config({ path: `${process.cwd()}/.env` });

async function applyMigrations() {
  try {
    console.log("🔄 Application des migrations manuelles...");

    const sql = neon(process.env.DATABASE_URL!);

    console.log("📋 Vérification de l'état actuel des tables...");

    // Vérifier si les colonnes existent déjà dans posts
    const postsColumnsResult = await sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'posts'
      AND table_schema = 'public'
      AND column_name IN ('company_id', 'images', 'updated_at')
    `;

    const existingPostsColumns = postsColumnsResult.map(
      (row) => (row as any).column_name
    );
    console.log("Colonnes existantes dans posts:", existingPostsColumns);

    // Vérifier si les colonnes city et coordinates existent dans companies
    const companiesColumnsResult = await sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'companies'
      AND table_schema = 'public'
      AND column_name IN ('city', 'coordinates')
    `;

    const existingCompaniesColumns = companiesColumnsResult.map(
      (row) => (row as any).column_name
    );
    console.log(
      "Colonnes existantes dans companies:",
      existingCompaniesColumns
    );

    // Appliquer les migrations manuellement pour posts
    if (!existingPostsColumns.includes("company_id")) {
      console.log("➕ Ajout de la colonne company_id...");
      await sql`ALTER TABLE "posts" ADD COLUMN "company_id" integer REFERENCES "companies"("id")`;
      console.log("✅ Colonne company_id ajoutée");
    }

    if (!existingPostsColumns.includes("images")) {
      console.log("➕ Ajout de la colonne images...");
      await sql`ALTER TABLE "posts" ADD COLUMN "images" jsonb DEFAULT '[]'::jsonb`;
      console.log("✅ Colonne images ajoutée");
    }

    if (!existingPostsColumns.includes("updated_at")) {
      console.log("➕ Ajout de la colonne updated_at...");
      await sql`ALTER TABLE "posts" ADD COLUMN "updated_at" timestamp DEFAULT now()`;
      console.log("✅ Colonne updated_at ajoutée");
    }

    // Ajouter la colonne city à companies si elle n'existe pas
    if (!existingCompaniesColumns.includes("city")) {
      console.log("➕ Ajout de la colonne city à la table companies...");
      await sql`ALTER TABLE "companies" ADD COLUMN "city" text`;
      console.log("✅ Colonne city ajoutée à la table companies");
    }

    // Ajouter la colonne coordinates à companies si elle n'existe pas
    if (!existingCompaniesColumns.includes("coordinates")) {
      console.log("➕ Ajout de la colonne coordinates à la table companies...");
      await sql`ALTER TABLE "companies" ADD COLUMN "coordinates" jsonb`;
      console.log("✅ Colonne coordinates ajoutée à la table companies");
    }

    // Vérifier si la table comments existe
    const commentsTableResult = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_name = 'comments'
      AND table_schema = 'public'
    `;

    if (commentsTableResult.length === 0) {
      console.log("📝 Création de la table comments...");

      // Créer la table comments
      await sql`
        CREATE TABLE "comments" (
          "id" serial PRIMARY KEY NOT NULL,
          "content" text NOT NULL,
          "post_id" integer NOT NULL,
          "user_id" integer,
          "company_id" integer,
          "parent_id" integer,
          "created_at" timestamp DEFAULT now() NOT NULL,
          "updated_at" timestamp DEFAULT now() NOT NULL
        )
      `;

      console.log("✅ Table comments créée");

      // Ajouter les contraintes de clés étrangères
      console.log("🔗 Ajout des contraintes de clés étrangères...");
      await sql`ALTER TABLE "comments" ADD CONSTRAINT "comments_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action`;
      await sql`ALTER TABLE "comments" ADD CONSTRAINT "comments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action`;
      await sql`ALTER TABLE "comments" ADD CONSTRAINT "comments_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action`;
      await sql`ALTER TABLE "comments" ADD CONSTRAINT "comments_parent_id_comments_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."comments"("id") ON DELETE no action ON UPDATE no action`;

      console.log("✅ Contraintes de clés étrangères ajoutées");
    }

    // Ajouter la contrainte de clé étrangère pour posts.company_id si elle n'existe pas
    const fkResult = await sql`
      SELECT constraint_name
      FROM information_schema.table_constraints
      WHERE table_name = 'posts'
      AND constraint_type = 'FOREIGN KEY'
      AND constraint_name = 'posts_company_id_companies_id_fk'
    `;

    if (fkResult.length === 0) {
      console.log(
        "🔗 Ajout de la contrainte de clé étrangère pour posts.company_id..."
      );
      await sql`ALTER TABLE "posts" ADD CONSTRAINT "posts_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action`;
      console.log("✅ Contrainte de clé étrangère ajoutée");
    }

    console.log("🎉 Toutes les migrations ont été appliquées avec succès !");

    // Vérification finale
    const finalColumnsResult = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'posts'
      AND table_schema = 'public'
      ORDER BY ordinal_position
    `;

    console.log("📊 État final de la table posts:");
    finalColumnsResult.forEach((row: any) => {
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

applyMigrations();
