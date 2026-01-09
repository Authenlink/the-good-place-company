import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";

// Charger les variables d'environnement
config({ path: `${process.cwd()}/.env` });

async function addColorColumn() {
  try {
    console.log("🔄 Ajout de la colonne color à la table company_values...");

    const sql = neon(process.env.DATABASE_URL!);

    // Vérifier si la colonne color existe déjà
    const columnsResult = await sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'company_values'
      AND table_schema = 'public'
      AND column_name = 'color'
    `;

    if (columnsResult.length === 0) {
      console.log("➕ Ajout de la colonne color...");
      await sql`ALTER TABLE "company_values" ADD COLUMN "color" text NOT NULL DEFAULT 'bg-gray-500'`;
      console.log("✅ Colonne color ajoutée");

      // Mettre à jour les valeurs existantes avec des couleurs
      console.log("🎨 Mise à jour des couleurs pour les valeurs existantes...");
      const colorUpdates = [
        { id: 1, color: "bg-blue-500" }, // Innovation
        { id: 2, color: "bg-green-500" }, // Durabilité
        { id: 3, color: "bg-purple-500" }, // Excellence
        { id: 4, color: "bg-red-500" }, // Intégrité
        { id: 5, color: "bg-orange-500" }, // Collaboration
        { id: 6, color: "bg-teal-500" }, // Responsabilité sociale
        { id: 7, color: "bg-cyan-500" }, // Transparence
        { id: 8, color: "bg-pink-500" }, // Qualité
      ];

      for (const update of colorUpdates) {
        await sql`UPDATE "company_values" SET "color" = ${update.color} WHERE "id" = ${update.id}`;
      }
      console.log("✅ Couleurs mises à jour");
    } else {
      console.log("ℹ️ La colonne color existe déjà");
    }

    console.log("🎉 Migration terminée avec succès !");
  } catch (error) {
    console.error("❌ Erreur lors de l'ajout de la colonne color:", error);
    process.exit(1);
  }
}

addColorColumn();
