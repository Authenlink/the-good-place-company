// Charger les variables d'environnement AVANT tout import
import { config } from "dotenv";
config({ path: `${process.cwd()}/.env` });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import {
  companyFollowers,
  companies,
  users,
  events,
  eventParticipants,
} from "@/lib/schema";
import { eq, sql } from "drizzle-orm";
import * as schema from "@/lib/schema";

// Créer la connexion à la base de données
const sqlConnection = neon(process.env.DATABASE_URL!);
const db = drizzle(sqlConnection, { schema });

async function seedFollowersData() {
  try {
    console.log("🌱 Génération de données fictives pour les abonnés...\n");

    // Récupérer la première entreprise disponible
    const allCompanies = await db.select().from(companies).limit(1);

    if (allCompanies.length === 0) {
      console.error(
        "❌ Aucune entreprise trouvée. Veuillez créer une entreprise d'abord."
      );
      process.exit(1);
    }

    const company = allCompanies[0];
    console.log(
      `📊 Entreprise sélectionnée: ${company.name} (ID: ${company.id})\n`
    );

    // Récupérer uniquement les utilisateurs existants (pas de création)
    console.log("👥 Récupération des utilisateurs existants...");
    const existingUsers = await db
      .select()
      .from(users)
      .where(eq(users.accountType, "user"));

    if (existingUsers.length === 0) {
      console.error(
        "❌ Aucun utilisateur trouvé. Veuillez créer au moins un utilisateur d'abord."
      );
      process.exit(1);
    }

    const userIds = existingUsers.map((u) => u.id);
    console.log(
      `✅ ${existingUsers.length} utilisateur(s) trouvé(s), utilisation de ces utilisateurs`
    );

    if (existingUsers.length < 10) {
      console.log(
        `⚠️  Attention: Seulement ${existingUsers.length} utilisateur(s) disponible(s).`
      );
      console.log(
        `   Les données seront générées avec ces utilisateurs (réutilisation si nécessaire).`
      );
    }

    // Nettoyer les données existantes pour cette entreprise (optionnel)
    console.log("\n🧹 Nettoyage des données existantes...");
    await db
      .delete(companyFollowers)
      .where(eq(companyFollowers.companyId, company.id));
    console.log("✅ Abonnements existants supprimés");

    // Récupérer les événements de l'entreprise
    const companyEvents = await db
      .select()
      .from(events)
      .where(eq(events.companyId, company.id))
      .limit(10);

    if (companyEvents.length > 0) {
      // Supprimer les participations existantes pour ces événements
      const eventIds = companyEvents.map((e) => e.id);
      for (const eventId of eventIds) {
        await db
          .delete(eventParticipants)
          .where(eq(eventParticipants.eventId, eventId));
      }
      console.log("✅ Participations existantes supprimées");
    }

    // Générer des abonnements sur les 4 derniers mois avec progression réaliste
    console.log("\n📈 Génération des abonnements sur 4 mois...");
    const now = new Date();
    const fourMonthsAgo = new Date(now);
    fourMonthsAgo.setMonth(fourMonthsAgo.getMonth() - 4);
    const daysDiff = Math.floor(
      (now.getTime() - fourMonthsAgo.getTime()) / (1000 * 60 * 60 * 24)
    );

    const followersToInsert = [];
    let followerIndex = 0;

    // Créer une progression réaliste : peu au début, plus vers la fin
    for (let day = 0; day < daysDiff; day++) {
      const date = new Date(fourMonthsAgo);
      date.setDate(date.getDate() + day);

      // Nombre d'abonnés ce jour : progression exponentielle douce
      // Entre 0 et 8 abonnés par jour, avec plus vers la fin
      const progress = day / daysDiff; // 0 à 1
      const baseCount = Math.floor(progress * 5); // 0 à 5
      const randomVariation = Math.floor(Math.random() * 4); // 0 à 3
      const dailyCount = Math.min(baseCount + randomVariation, 8);

      for (let i = 0; i < dailyCount; i++) {
        const createdAt = new Date(date);
        // Répartir sur la journée
        createdAt.setHours(9 + Math.floor(Math.random() * 8));
        createdAt.setMinutes(Math.floor(Math.random() * 60));

        // Réutiliser les utilisateurs de manière cyclique si nécessaire
        const userId = userIds[followerIndex % userIds.length];

        followersToInsert.push({
          companyId: company.id,
          userId: userId,
          createdAt,
        });
        followerIndex++;
      }
    }

    if (followersToInsert.length > 0) {
      // Insérer par lots de 50 pour éviter les problèmes de taille
      for (let i = 0; i < followersToInsert.length; i += 50) {
        const batch = followersToInsert.slice(i, i + 50);
        await db.insert(companyFollowers).values(batch).onConflictDoNothing();
      }
      console.log(`✅ ${followersToInsert.length} abonnements créés`);
    } else {
      console.log("⚠️  Aucun abonnement créé (pas assez d'utilisateurs)");
    }

    // Générer des participations aux événements
    if (companyEvents.length > 0) {
      console.log("\n🎫 Génération des participations aux événements...");
      const participantsToInsert = [];
      let participantIndex = 0;

      // Pour chaque événement, créer des participations sur les 4 derniers mois
      for (const event of companyEvents) {
        const eventStartDate = new Date(event.startDate);
        const registrationStartDate = new Date(eventStartDate);
        registrationStartDate.setDate(registrationStartDate.getDate() - 14); // Inscriptions commencent 14 jours avant

        // Nombre de participants pour cet événement (entre 30 et 100)
        // Permet beaucoup plus de participants même avec peu d'utilisateurs (réutilisation)
        const participantCount = Math.floor(Math.random() * 70) + 30;

        for (let i = 0; i < participantCount; i++) {
          // Date d'inscription aléatoire entre le début des inscriptions et aujourd'hui
          const registrationDate = new Date(
            Math.max(registrationStartDate.getTime(), fourMonthsAgo.getTime()) +
              Math.random() *
                (now.getTime() -
                  Math.max(
                    registrationStartDate.getTime(),
                    fourMonthsAgo.getTime()
                  ))
          );

          // Réutiliser les utilisateurs de manière cyclique
          const userId = userIds[participantIndex % userIds.length];

          participantsToInsert.push({
            eventId: event.id,
            userId: userId,
            status: "confirmed" as const,
            createdAt: registrationDate,
          });
          participantIndex++;
        }
      }

      if (participantsToInsert.length > 0) {
        // Insérer par lots de 50
        for (let i = 0; i < participantsToInsert.length; i += 50) {
          const batch = participantsToInsert.slice(i, i + 50);
          await db
            .insert(eventParticipants)
            .values(batch)
            .onConflictDoNothing();
        }
        console.log(`✅ ${participantsToInsert.length} participations créées`);
      }
    } else {
      console.log("\n⚠️  Aucun événement trouvé pour cette entreprise");
      console.log("   Les participations ne seront pas générées");
    }

    // Afficher un résumé
    console.log("\n📊 Résumé des données générées:");
    const totalFollowers = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(companyFollowers)
      .where(eq(companyFollowers.companyId, company.id));

    const totalParticipants = await db
      .select({
        count: sql<number>`count(distinct ${eventParticipants.userId})::int`,
      })
      .from(eventParticipants)
      .innerJoin(events, eq(eventParticipants.eventId, events.id))
      .where(eq(events.companyId, company.id));

    console.log(`- Total abonnés: ${totalFollowers[0]?.count || 0}`);
    console.log(
      `- Total participants uniques: ${totalParticipants[0]?.count || 0}`
    );

    console.log("\n🎉 Données fictives générées avec succès!");
    console.log(
      "\nVous pouvez maintenant voir les graphiques avec des données réalistes."
    );
  } catch (error) {
    console.error("❌ Erreur lors de la génération des données:", error);
    throw error;
  } finally {
    process.exit(0);
  }
}

seedFollowersData();
