import { db } from "./db";
import { notifications, users, companies, events } from "./schema";
import { eq } from "drizzle-orm";
import type { NotificationType } from "./schema";

interface CreateNotificationParams {
  userId: number;
  type: NotificationType;
  relatedUserId?: number;
  relatedCompanyId?: number;
  relatedPostId?: number;
  relatedEventId?: number;
  relatedCommentId?: number;
  relatedEventCommentId?: number;
  relatedParticipantId?: number;
}

/**
 * Crée une notification dans la base de données
 * Gère les erreurs silencieusement pour ne pas bloquer les actions principales
 */
export async function createNotification(
  params: CreateNotificationParams
): Promise<void> {
  try {
    const {
      userId,
      type,
      relatedUserId,
      relatedCompanyId,
      relatedPostId,
      relatedEventId,
      relatedCommentId,
      relatedEventCommentId,
      relatedParticipantId,
    } = params;

    // Construire le message selon le type de notification
    const message = await buildNotificationMessage({
      type,
      relatedUserId,
      relatedCompanyId,
      relatedPostId,
      relatedEventId,
    });

    // Insérer la notification
    await db.insert(notifications).values({
      userId,
      type,
      relatedUserId,
      relatedCompanyId,
      relatedPostId,
      relatedEventId,
      relatedCommentId,
      relatedEventCommentId,
      relatedParticipantId,
      message,
      read: false,
    });
  } catch (error) {
    // Gérer les erreurs silencieusement pour ne pas bloquer les actions principales
    console.error("Erreur lors de la création de la notification:", error);
  }
}

/**
 * Construit le message de notification selon le type
 */
async function buildNotificationMessage(params: {
  type: NotificationType;
  relatedUserId?: number;
  relatedCompanyId?: number;
  relatedPostId?: number;
  relatedEventId?: number;
}): Promise<string> {
  const { type, relatedUserId, relatedCompanyId, relatedPostId, relatedEventId } =
    params;

  switch (type) {
    case "company_followed":
      if (relatedUserId) {
        const user = await db
          .select({ name: users.name })
          .from(users)
          .where(eq(users.id, relatedUserId))
          .limit(1);
        const userName = user[0]?.name || "Un utilisateur";
        return `${userName} suit maintenant votre entreprise`;
      }
      return "Un utilisateur suit maintenant votre entreprise";

    case "user_followed":
      if (relatedUserId) {
        const user = await db
          .select({ name: users.name })
          .from(users)
          .where(eq(users.id, relatedUserId))
          .limit(1);
        const userName = user[0]?.name || "Un utilisateur";
        return `${userName} vous suit maintenant`;
      }
      return "Un utilisateur vous suit maintenant";

    case "event_registration":
      if (relatedUserId) {
        const user = await db
          .select({ name: users.name })
          .from(users)
          .where(eq(users.id, relatedUserId))
          .limit(1);
        const userName = user[0]?.name || "Un utilisateur";
        if (relatedEventId) {
          const event = await db
            .select({ title: events.title })
            .from(events)
            .where(eq(events.id, relatedEventId))
            .limit(1);
          const eventTitle = event[0]?.title || "un événement";
          return `${userName} s'est inscrit à votre événement "${eventTitle}"`;
        }
        return `${userName} s'est inscrit à votre événement`;
      }
      return "Un utilisateur s'est inscrit à votre événement";

    case "post_liked":
      if (relatedUserId) {
        const user = await db
          .select({ name: users.name })
          .from(users)
          .where(eq(users.id, relatedUserId))
          .limit(1);
        const userName = user[0]?.name || "Un utilisateur";
        return `${userName} a aimé votre publication`;
      } else if (relatedCompanyId) {
        const company = await db
          .select({ name: companies.name })
          .from(companies)
          .where(eq(companies.id, relatedCompanyId))
          .limit(1);
        const companyName = company[0]?.name || "Une entreprise";
        return `${companyName} a aimé votre publication`;
      }
      return "Quelqu'un a aimé votre publication";

    case "event_liked":
      if (relatedUserId) {
        const user = await db
          .select({ name: users.name })
          .from(users)
          .where(eq(users.id, relatedUserId))
          .limit(1);
        const userName = user[0]?.name || "Un utilisateur";
        return `${userName} a aimé votre événement`;
      } else if (relatedCompanyId) {
        const company = await db
          .select({ name: companies.name })
          .from(companies)
          .where(eq(companies.id, relatedCompanyId))
          .limit(1);
        const companyName = company[0]?.name || "Une entreprise";
        return `${companyName} a aimé votre événement`;
      }
      return "Quelqu'un a aimé votre événement";

    case "post_commented":
      if (relatedUserId) {
        const user = await db
          .select({ name: users.name })
          .from(users)
          .where(eq(users.id, relatedUserId))
          .limit(1);
        const userName = user[0]?.name || "Un utilisateur";
        return `${userName} a commenté votre publication`;
      } else if (relatedCompanyId) {
        const company = await db
          .select({ name: companies.name })
          .from(companies)
          .where(eq(companies.id, relatedCompanyId))
          .limit(1);
        const companyName = company[0]?.name || "Une entreprise";
        return `${companyName} a commenté votre publication`;
      }
      return "Quelqu'un a commenté votre publication";

    case "event_commented":
      if (relatedUserId) {
        const user = await db
          .select({ name: users.name })
          .from(users)
          .where(eq(users.id, relatedUserId))
          .limit(1);
        const userName = user[0]?.name || "Un utilisateur";
        return `${userName} a commenté votre événement`;
      } else if (relatedCompanyId) {
        const company = await db
          .select({ name: companies.name })
          .from(companies)
          .where(eq(companies.id, relatedCompanyId))
          .limit(1);
        const companyName = company[0]?.name || "Une entreprise";
        return `${companyName} a commenté votre événement`;
      }
      return "Quelqu'un a commenté votre événement";

    case "comment_liked":
      if (relatedUserId) {
        const user = await db
          .select({ name: users.name })
          .from(users)
          .where(eq(users.id, relatedUserId))
          .limit(1);
        const userName = user[0]?.name || "Un utilisateur";
        return `${userName} a aimé votre commentaire`;
      } else if (relatedCompanyId) {
        const company = await db
          .select({ name: companies.name })
          .from(companies)
          .where(eq(companies.id, relatedCompanyId))
          .limit(1);
        const companyName = company[0]?.name || "Une entreprise";
        return `${companyName} a aimé votre commentaire`;
      }
      return "Quelqu'un a aimé votre commentaire";

    case "event_comment_liked":
      if (relatedUserId) {
        const user = await db
          .select({ name: users.name })
          .from(users)
          .where(eq(users.id, relatedUserId))
          .limit(1);
        const userName = user[0]?.name || "Un utilisateur";
        return `${userName} a aimé votre commentaire`;
      } else if (relatedCompanyId) {
        const company = await db
          .select({ name: companies.name })
          .from(companies)
          .where(eq(companies.id, relatedCompanyId))
          .limit(1);
        const companyName = company[0]?.name || "Une entreprise";
        return `${companyName} a aimé votre commentaire`;
      }
      return "Quelqu'un a aimé votre commentaire";

    case "event_registration_confirmed":
      if (relatedEventId) {
        const event = await db
          .select({ title: events.title })
          .from(events)
          .where(eq(events.id, relatedEventId))
          .limit(1);
        const eventTitle = event[0]?.title || "un événement";
        return `Votre inscription à l'événement "${eventTitle}" a été confirmée`;
      }
      return "Votre inscription à l'événement a été confirmée";

    case "event_registration_rejected":
      if (relatedEventId) {
        const event = await db
          .select({ title: events.title })
          .from(events)
          .where(eq(events.id, relatedEventId))
          .limit(1);
        const eventTitle = event[0]?.title || "un événement";
        return `Votre inscription à l'événement "${eventTitle}" a été refusée`;
      }
      return "Votre inscription à l'événement a été refusée";

    case "event_registration_waitlisted":
      if (relatedEventId) {
        const event = await db
          .select({ title: events.title })
          .from(events)
          .where(eq(events.id, relatedEventId))
          .limit(1);
        const eventTitle = event[0]?.title || "un événement";
        return `Votre inscription à l'événement "${eventTitle}" est en liste d'attente`;
      }
      return "Votre inscription à l'événement est en liste d'attente";

    default:
      return "Nouvelle notification";
  }
}
