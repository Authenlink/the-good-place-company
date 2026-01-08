// Charger les variables d'environnement AVANT tout import
import { config } from "dotenv";
config({ path: `${process.cwd()}/.env` });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import {
  companyFollowers,
  companies,
  eventParticipants,
  events,
} from "@/lib/schema";
import { eq } from "drizzle-orm";
import * as schema from "@/lib/schema";

// Créer la connexion à la base de données
const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

async function cleanFollowersData() {
  try {
    console.log("🧹 Nettoyage des données fictives d'abonnés...\n");

    // Récupérer la première entreprise disponible
    const allCompanies = await db.select().from(companies).limit(1);

    if (allCompanies.length === 0) {
      console.error("❌ Aucune entreprise trouvée.");
      process.exit(1);
    }

    const company = allCompanies[0];
    console.log(
      `📊 Entreprise sélectionnée: ${company.name} (ID: ${company.id})\n`
    );

    // Supprimer tous les abonnements de cette entreprise
    console.log("🗑️  Suppression des abonnements...");
    const deletedFollowers = await db
      .delete(companyFollowers)
      .where(eq(companyFollowers.companyId, company.id))
      .returning();

    console.log(`✅ ${deletedFollowers.length} abonnements supprimés`);

    // Supprimer les participations aux événements de cette entreprise
    console.log("\n🗑️  Suppression des participations aux événements...");
    const companyEvents = await db
      .select()
      .from(events)
      .where(eq(events.companyId, company.id));

    let totalDeletedParticipants = 0;
    if (companyEvents.length > 0) {
      for (const event of companyEvents) {
        const deletedParticipants = await db
          .delete(eventParticipants)
          .where(eq(eventParticipants.eventId, event.id))
          .returning();
        totalDeletedParticipants += deletedParticipants.length;
      }
      console.log(`✅ ${totalDeletedParticipants} participations supprimées`);
    } else {
      console.log(
        "ℹ️  Aucun événement trouvé, aucune participation à supprimer"
      );
    }

    console.log("\n🎉 Nettoyage terminé avec succès!");
    console.log("   Toutes les données fictives ont été supprimées.");
  } catch (error) {
    console.error("❌ Erreur lors du nettoyage:", error);
    throw error;
  } finally {
    process.exit(0);
  }
}

cleanFollowersData();
