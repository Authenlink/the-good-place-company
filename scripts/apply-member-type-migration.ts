import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
import * as fs from "fs";
import * as path from "path";

// Charger les variables d'environnement
config({ path: `${process.cwd()}/.env` });

async function applyMemberTypeMigration() {
  try {
    console.log(
      "🔄 Application de la migration pour ajouter member_type à user_company_memberships...",
    );

    const sql = neon(process.env.DATABASE_URL!);

    // Vérifier si la colonne existe déjà
    console.log("📋 Vérification de l'état actuel de la colonne...");

    const columnsResult = await sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'user_company_memberships'
      AND column_name = 'member_type'
    `;

    const columnExists = columnsResult.length > 0;
    console.log("Colonne member_type existe:", columnExists);

    // Appliquer la migration si la colonne n'existe pas
    if (!columnExists) {
      console.log("➕ Ajout de la colonne member_type...");

      try {
        // Ajouter la colonne avec valeur par défaut
        await sql`
          ALTER TABLE "user_company_memberships" 
          ADD COLUMN "member_type" TEXT DEFAULT 'volunteer' NOT NULL
        `;
        console.log("✅ Colonne ajoutée");

        // Mettre à jour les membres existants avec la valeur par défaut
        console.log("🔄 Mise à jour des membres existants...");
        await sql`
          UPDATE "user_company_memberships" 
          SET "member_type" = 'volunteer' 
          WHERE "member_type" IS NULL
        `;
        console.log("✅ Membres existants mis à jour");

        // Créer l'index
        console.log("➕ Création de l'index...");
        await sql`
          CREATE INDEX IF NOT EXISTS "user_company_memberships_member_type_idx" 
          ON "user_company_memberships"("member_type")
        `;
        console.log("✅ Index créé");

        console.log("✅ Migration appliquée avec succès");
      } catch (error: any) {
        console.error("❌ Erreur lors de l'ajout de la colonne:", error.message);
        throw error;
      }
    } else {
      console.log("ℹ️  La colonne member_type existe déjà");

      // Vérifier l'index
      console.log("📊 Vérification de l'index...");

      const indexCheck = await sql`
        SELECT indexname
        FROM pg_indexes
        WHERE schemaname = 'public'
        AND indexname = 'user_company_memberships_member_type_idx'
      `;

      if (indexCheck.length === 0) {
        console.log("⚠️  Index manquant - création...");
        await sql`
          CREATE INDEX IF NOT EXISTS "user_company_memberships_member_type_idx" 
          ON "user_company_memberships"("member_type")
        `;
        console.log("✅ Index créé");
      } else {
        console.log("✅ Index existe déjà");
      }
    }

    console.log("🎉 Migration appliquée avec succès !");

    // Vérification finale
    const finalColumns = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'user_company_memberships'
      AND table_schema = 'public'
      AND column_name = 'member_type'
    `;

    if (finalColumns.length > 0) {
      console.log("📊 Colonne member_type:");
      const col = finalColumns[0] as any;
      console.log(`   - Nom: ${col.column_name}`);
      console.log(`   - Type: ${col.data_type}`);
      console.log(`   - Nullable: ${col.is_nullable}`);
      console.log(`   - Défaut: ${col.column_default}`);
    }

    // Compter les membres par type
    const memberStats = await sql`
      SELECT member_type, COUNT(*) as count
      FROM user_company_memberships
      GROUP BY member_type
    `;

    console.log("📊 Statistiques des membres:");
    memberStats.forEach((row: any) => {
      console.log(`   - ${row.member_type}: ${row.count} membre(s)`);
    });
  } catch (error) {
    console.error("❌ Erreur lors de l'application de la migration:", error);
    process.exit(1);
  }
}

applyMemberTypeMigration();
