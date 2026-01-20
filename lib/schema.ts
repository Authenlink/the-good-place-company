import {
  pgTable,
  serial,
  text,
  timestamp,
  integer,
  jsonb,
  boolean,
  numeric,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Table users étendue pour NextAuth
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("email_verified"),
  image: text("image"),
  password: text("password"), // Hashé avec bcrypt, nullable pour OAuth
  accountType: text("account_type").notNull().default("user"), // "user" | "business"
  // Champs de profil utilisateur
  bio: text("bio"), // Description/biographie
  location: text("location"), // Localisation géographique
  website: text("website"), // Site web personnel
  banner: text("banner"), // Image de bannière
  backgroundType: text("background_type").$type<"image" | "gradient" | null>(),
  backgroundGradient: jsonb("background_gradient").$type<{
    color1: string;
    color2: string;
    css: string;
  }>(),
  referencedCity: text("referenced_city"), // Ville de référence pour le calendrier d'événements
  // Présence en ligne et réseaux sociaux
  isOnline: boolean("is_online").default(false),
  instagramUrl: text("instagram_url"),
  tiktokUrl: text("tiktok_url"),
  linkedinUrl: text("linkedin_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Table areas pour les secteurs d'activité
export const areas = pgTable("areas", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Table company_values pour les valeurs d'entreprise
export const companyValues = pgTable("company_values", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  color: text("color").notNull().default("bg-gray-500"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Table companies pour les comptes entreprise
export const companies = pgTable("companies", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  logo: text("logo"),
  background: text("background"), // Image de banner
  backgroundType: text("background_type").$type<"image" | "gradient" | null>(),
  backgroundGradient: jsonb("background_gradient").$type<{
    color1: string;
    color2: string;
    css: string;
  }>(),
  areaId: integer("area_id").references(() => areas.id),
  values: jsonb("values").$type<string[]>(), // Array des IDs des valeurs sélectionnées
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  city: text("city"),
  coordinates: jsonb("coordinates").$type<{ lat: number; lng: number }>(), // Coordonnées GPS directes
  website: text("website"),
  founded: text("founded"),
  size: text("size"),
  // Présence en ligne et réseaux sociaux
  isOnline: boolean("is_online").default(false),
  instagramUrl: text("instagram_url"),
  tiktokUrl: text("tiktok_url"),
  linkedinUrl: text("linkedin_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Table accounts pour OAuth (préparé pour le futur)
export const accounts = pgTable("accounts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // "oauth" | "email" | "credentials"
  provider: text("provider").notNull(),
  providerAccountId: text("provider_account_id").notNull(),
  refreshToken: text("refresh_token"),
  accessToken: text("access_token"),
  expiresAt: integer("expires_at"),
  tokenType: text("token_type"),
  scope: text("scope"),
  idToken: text("id_token"),
  sessionState: text("session_state"),
});

// Table sessions pour NextAuth
export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  sessionToken: text("session_token").notNull().unique(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires").notNull(),
});

// Table verificationTokens pour NextAuth
export const verificationTokens = pgTable("verification_tokens", {
  identifier: text("identifier").notNull(),
  token: text("token").notNull().unique(),
  expires: timestamp("expires").notNull(),
});

// Table posts améliorée pour le réseau social
export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  images: jsonb("images").$type<string[]>(), // Array d'URLs d'images
  userId: integer("user_id").references(() => users.id),
  companyId: integer("company_id").references(() => companies.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Table comments pour les commentaires sur les posts
export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  postId: integer("post_id")
    .notNull()
    .references(() => posts.id, { onDelete: "cascade" }),
  userId: integer("user_id").references(() => users.id),
  companyId: integer("company_id").references(() => companies.id),
  parentId: integer("parent_id").references((): any => comments.id), // Pour les réponses aux commentaires
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Types d'événements
export const EVENT_TYPES = {
  maraude: "Maraude",
  distribution_alimentaire: "Distribution alimentaire",
  distribution_vetements: "Distribution de vêtements",
  action_ecologique: "Action écologique",
  collecte_dons: "Collecte de dons",
  collecte_fonds: "Collecte de fonds",
  soiree_caritative: "Soirée caritative",
  vente_solidaire: "Vente solidaire",
  concert_benefice: "Concert bénéfice",
  repas_partage: "Repas partagé",
  atelier: "Atelier / Formation",
  sensibilisation: "Sensibilisation",
  benevolat: "Mission bénévolat",
  autre: "Autre",
} as const;

export type EventType = keyof typeof EVENT_TYPES;

// Catégories d'événements (pour regroupement visuel)
export const EVENT_CATEGORIES = {
  terrain: {
    label: "Actions terrain",
    types: [
      "maraude",
      "distribution_alimentaire",
      "distribution_vetements",
      "action_ecologique",
      "benevolat",
    ],
  },
  collecte: {
    label: "Collecte & Financement",
    types: [
      "collecte_dons",
      "collecte_fonds",
      "soiree_caritative",
      "vente_solidaire",
      "concert_benefice",
    ],
  },
  communaute: {
    label: "Communauté",
    types: ["repas_partage", "atelier", "sensibilisation"],
  },
  autre: {
    label: "Autre",
    types: ["autre"],
  },
} as const;

// Types de récurrence
export const RECURRENCE_TYPES = {
  none: "Événement unique",
  daily: "Quotidienne",
  weekly: "Hebdomadaire",
  monthly: "Mensuel",
} as const;

export type RecurrenceType = keyof typeof RECURRENCE_TYPES;

// Statuts d'événement
export const EVENT_STATUSES = {
  draft: "Brouillon",
  published: "Publié",
  cancelled: "Annulé",
  completed: "Terminé",
} as const;

export type EventStatus = keyof typeof EVENT_STATUSES;

// Statuts de participant
export const PARTICIPANT_STATUSES = {
  pending: "En attente de validation",
  confirmed: "Inscrit",
  waitlisted: "Liste d'attente",
  cancelled: "Annulé",
} as const;

export type ParticipantStatus = keyof typeof PARTICIPANT_STATUSES;

// ==================== PROJETS ====================

// Tags prédéfinis pour les projets
export const PROJECT_TAGS = {
  humanitaire: { name: "Humanitaire", color: "bg-red-500" },
  ecologie: { name: "Écologie", color: "bg-green-500" },
  education: { name: "Éducation", color: "bg-blue-500" },
  sante: { name: "Santé", color: "bg-pink-500" },
  culture: { name: "Culture", color: "bg-purple-500" },
  sport: { name: "Sport", color: "bg-orange-500" },
  insertion: { name: "Insertion", color: "bg-teal-500" },
  solidarite: { name: "Solidarité", color: "bg-amber-500" },
  animaux: { name: "Animaux", color: "bg-lime-500" },
  international: { name: "International", color: "bg-cyan-500" },
} as const;

export type ProjectTagKey = keyof typeof PROJECT_TAGS;

// Statuts de projet
export const PROJECT_STATUSES = {
  active: "Actif",
  archived: "Archivé",
} as const;

export type ProjectStatus = keyof typeof PROJECT_STATUSES;

// Table project_tags pour les tags prédéfinis
export const projectTags = pgTable("project_tags", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(), // ex: "humanitaire"
  name: text("name").notNull(), // ex: "Humanitaire"
  color: text("color").notNull(), // ex: "bg-red-500"
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Table projects pour les projets des associations
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  shortDescription: text("short_description"), // Description courte pour les cartes
  fullDescription: text("full_description"), // Description complète
  // Visuels
  bannerImage: text("banner_image"), // Image de banner principale
  carouselImages: jsonb("carousel_images").$type<string[]>(), // Jusqu'à 10 images pour le carrousel
  // Contenu
  objectives: text("objectives"), // Objectifs du projet
  achievements: text("achievements"), // Réalisations
  impact: text("impact"), // Mesure de l'impact
  // Tags (prédéfinis + custom)
  tags: jsonb("tags").$type<string[]>(), // Array de clés de tags prédéfinis
  customTags: jsonb("custom_tags").$type<string[]>(), // Tags personnalisés créés par l'association
  // Contact
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  externalLink: text("external_link"),
  // Métadonnées
  status: text("status").$type<ProjectStatus>().notNull().default("active"),
  companyId: integer("company_id")
    .notNull()
    .references(() => companies.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Table events pour les événements des associations
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  eventType: text("event_type").notNull().$type<EventType>(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  location: text("location"), // Nom du lieu
  address: text("address"), // Adresse complète
  city: text("city"),
  coordinates: jsonb("coordinates").$type<{ lat: number; lng: number }>(),
  images: jsonb("images").$type<string[]>(),
  coverImage: text("cover_image"), // Image de cover séparée
  backgroundType: text("background_type").$type<"image" | "gradient" | null>(),
  backgroundImageIndex: integer("background_image_index"),
  backgroundGradient: jsonb("background_gradient").$type<{
    color1: string;
    color2: string;
    css: string;
  }>(),
  maxParticipants: integer("max_participants"),
  recurrence: text("recurrence").$type<RecurrenceType>().default("none"),
  recurrenceEndDate: timestamp("recurrence_end_date"),
  recurrenceGroupId: integer("recurrence_group_id").references((): any => events.id, { onDelete: "cascade" }), // ID du premier événement de la série (null pour événements uniques ou premier événement)
  // Champs pour événements payants / collecte de fonds
  isPaid: boolean("is_paid").default(false),
  price: numeric("price", { precision: 10, scale: 2 }),
  currency: text("currency").default("EUR"),
  fundraisingGoal: numeric("fundraising_goal", { precision: 10, scale: 2 }),
  // Informations supplémentaires
  requirements: text("requirements"), // Ce qu'il faut apporter / prérequis
  targetAudience: text("target_audience"), // Public cible
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  externalLink: text("external_link"), // Lien vers billetterie externe, etc.
  status: text("status").$type<EventStatus>().notNull().default("draft"),
  validated: boolean("validated"), // null = non validé, true = présent validé, false = absent validé
  companyId: integer("company_id")
    .notNull()
    .references(() => companies.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Table eventParticipants pour les inscriptions aux événements
export const eventParticipants = pgTable("event_participants", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id")
    .notNull()
    .references(() => events.id, { onDelete: "cascade" }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  status: text("status")
    .$type<ParticipantStatus>()
    .notNull()
    .default("confirmed"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Table company_followers pour les abonnements aux entreprises
export const companyFollowers = pgTable("company_followers", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id")
    .notNull()
    .references(() => companies.id, { onDelete: "cascade" }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Table user_follows pour les abonnements entre utilisateurs
export const userFollows = pgTable("user_follows", {
  id: serial("id").primaryKey(),
  followerId: integer("follower_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  followingId: integer("following_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Table post_likes pour les likes sur les posts
export const postLikes = pgTable("post_likes", {
  id: serial("id").primaryKey(),
  postId: integer("post_id")
    .notNull()
    .references(() => posts.id, { onDelete: "cascade" }),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  companyId: integer("company_id").references(() => companies.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Table event_likes pour les likes sur les événements
export const eventLikes = pgTable("event_likes", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id")
    .notNull()
    .references(() => events.id, { onDelete: "cascade" }),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  companyId: integer("company_id").references(() => companies.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Table event_comments pour les commentaires sur les événements
export const eventComments = pgTable("event_comments", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  eventId: integer("event_id")
    .notNull()
    .references(() => events.id, { onDelete: "cascade" }),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  companyId: integer("company_id").references(() => companies.id, { onDelete: "cascade" }),
  parentId: integer("parent_id").references((): any => eventComments.id, { onDelete: "cascade" }), // Pour les réponses aux commentaires
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Table comment_likes pour les likes sur les commentaires de posts
export const commentLikes = pgTable("comment_likes", {
  id: serial("id").primaryKey(),
  commentId: integer("comment_id")
    .notNull()
    .references(() => comments.id, { onDelete: "cascade" }),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  companyId: integer("company_id").references(() => companies.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Table event_comment_likes pour les likes sur les commentaires d'événements
export const eventCommentLikes = pgTable("event_comment_likes", {
  id: serial("id").primaryKey(),
  eventCommentId: integer("event_comment_id")
    .notNull()
    .references(() => eventComments.id, { onDelete: "cascade" }),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  companyId: integer("company_id").references(() => companies.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Types de notifications
export const NOTIFICATION_TYPES = {
  // Pour les entreprises
  company_followed: "company_followed",
  event_registration: "event_registration",
  post_liked: "post_liked",
  event_liked: "event_liked",
  post_commented: "post_commented",
  event_commented: "event_commented",
  // Pour les utilisateurs
  user_followed: "user_followed",
  comment_liked: "comment_liked",
  event_comment_liked: "event_comment_liked",
  event_registration_confirmed: "event_registration_confirmed",
  event_registration_rejected: "event_registration_rejected",
  event_registration_waitlisted: "event_registration_waitlisted",
} as const;

export type NotificationType = keyof typeof NOTIFICATION_TYPES;

// Table notifications
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull().$type<NotificationType>(),
  relatedUserId: integer("related_user_id").references(() => users.id, { onDelete: "set null" }),
  relatedCompanyId: integer("related_company_id").references(() => companies.id, { onDelete: "set null" }),
  relatedPostId: integer("related_post_id").references(() => posts.id, { onDelete: "cascade" }),
  relatedEventId: integer("related_event_id").references(() => events.id, { onDelete: "cascade" }),
  relatedCommentId: integer("related_comment_id").references(() => comments.id, { onDelete: "cascade" }),
  relatedEventCommentId: integer("related_event_comment_id").references(() => eventComments.id, { onDelete: "cascade" }),
  relatedParticipantId: integer("related_participant_id").references(() => eventParticipants.id, { onDelete: "cascade" }),
  message: text("message").notNull(),
  read: boolean("read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
  company: one(companies),
  posts: many(posts),
  comments: many(comments),
  eventParticipations: many(eventParticipants),
  companyFollows: many(companyFollowers),
  following: many(userFollows, {
    relationName: "follower",
  }),
  followers: many(userFollows, {
    relationName: "following",
  }),
  postLikes: many(postLikes),
  eventLikes: many(eventLikes),
  eventComments: many(eventComments),
  commentLikes: many(commentLikes),
  eventCommentLikes: many(eventCommentLikes),
  notifications: many(notifications),
}));

export const companiesRelations = relations(companies, ({ one, many }) => ({
  user: one(users, {
    fields: [companies.userId],
    references: [users.id],
  }),
  area: one(areas, {
    fields: [companies.areaId],
    references: [areas.id],
  }),
  posts: many(posts),
  comments: many(comments),
  events: many(events),
  projects: many(projects),
  followers: many(companyFollowers),
  postLikes: many(postLikes),
  eventLikes: many(eventLikes),
  eventComments: many(eventComments),
  commentLikes: many(commentLikes),
  eventCommentLikes: many(eventCommentLikes),
}));

export const projectsRelations = relations(projects, ({ one }) => ({
  company: one(companies, {
    fields: [projects.companyId],
    references: [companies.id],
  }),
}));

export const eventsRelations = relations(events, ({ one, many }) => ({
  company: one(companies, {
    fields: [events.companyId],
    references: [companies.id],
  }),
  participants: many(eventParticipants),
  likes: many(eventLikes),
  comments: many(eventComments),
}));

export const eventParticipantsRelations = relations(
  eventParticipants,
  ({ one }) => ({
    event: one(events, {
      fields: [eventParticipants.eventId],
      references: [events.id],
    }),
    user: one(users, {
      fields: [eventParticipants.userId],
      references: [users.id],
    }),
  })
);

export const postsRelations = relations(posts, ({ one, many }) => ({
  user: one(users, {
    fields: [posts.userId],
    references: [users.id],
  }),
  company: one(companies, {
    fields: [posts.companyId],
    references: [companies.id],
  }),
  comments: many(comments),
  likes: many(postLikes),
}));

export const commentsRelations = relations(comments, ({ one, many }) => ({
  post: one(posts, {
    fields: [comments.postId],
    references: [posts.id],
  }),
  user: one(users, {
    fields: [comments.userId],
    references: [users.id],
  }),
  company: one(companies, {
    fields: [comments.companyId],
    references: [companies.id],
  }),
  parent: one(comments, {
    fields: [comments.parentId],
    references: [comments.id],
  }),
  replies: many(comments),
  likes: many(commentLikes),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const companyFollowersRelations = relations(
  companyFollowers,
  ({ one }) => ({
    company: one(companies, {
      fields: [companyFollowers.companyId],
      references: [companies.id],
    }),
    user: one(users, {
      fields: [companyFollowers.userId],
      references: [users.id],
    }),
  })
);

export const userFollowsRelations = relations(
  userFollows,
  ({ one }) => ({
    follower: one(users, {
      fields: [userFollows.followerId],
      references: [users.id],
      relationName: "follower",
    }),
    following: one(users, {
      fields: [userFollows.followingId],
      references: [users.id],
      relationName: "following",
    }),
  })
);

export const postLikesRelations = relations(postLikes, ({ one }) => ({
  post: one(posts, {
    fields: [postLikes.postId],
    references: [posts.id],
  }),
  user: one(users, {
    fields: [postLikes.userId],
    references: [users.id],
  }),
  company: one(companies, {
    fields: [postLikes.companyId],
    references: [companies.id],
  }),
}));

export const eventLikesRelations = relations(eventLikes, ({ one }) => ({
  event: one(events, {
    fields: [eventLikes.eventId],
    references: [events.id],
  }),
  user: one(users, {
    fields: [eventLikes.userId],
    references: [users.id],
  }),
  company: one(companies, {
    fields: [eventLikes.companyId],
    references: [companies.id],
  }),
}));

export const eventCommentsRelations = relations(eventComments, ({ one, many }) => ({
  event: one(events, {
    fields: [eventComments.eventId],
    references: [events.id],
  }),
  user: one(users, {
    fields: [eventComments.userId],
    references: [users.id],
  }),
  company: one(companies, {
    fields: [eventComments.companyId],
    references: [companies.id],
  }),
  parent: one(eventComments, {
    fields: [eventComments.parentId],
    references: [eventComments.id],
  }),
  replies: many(eventComments),
  likes: many(eventCommentLikes),
}));

export const commentLikesRelations = relations(commentLikes, ({ one }) => ({
  comment: one(comments, {
    fields: [commentLikes.commentId],
    references: [comments.id],
  }),
  user: one(users, {
    fields: [commentLikes.userId],
    references: [users.id],
  }),
  company: one(companies, {
    fields: [commentLikes.companyId],
    references: [companies.id],
  }),
}));

export const eventCommentLikesRelations = relations(eventCommentLikes, ({ one }) => ({
  eventComment: one(eventComments, {
    fields: [eventCommentLikes.eventCommentId],
    references: [eventComments.id],
  }),
  user: one(users, {
    fields: [eventCommentLikes.userId],
    references: [users.id],
  }),
  company: one(companies, {
    fields: [eventCommentLikes.companyId],
    references: [companies.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
  relatedUser: one(users, {
    fields: [notifications.relatedUserId],
    references: [users.id],
    relationName: "relatedUser",
  }),
  relatedCompany: one(companies, {
    fields: [notifications.relatedCompanyId],
    references: [companies.id],
  }),
  relatedPost: one(posts, {
    fields: [notifications.relatedPostId],
    references: [posts.id],
  }),
  relatedEvent: one(events, {
    fields: [notifications.relatedEventId],
    references: [events.id],
  }),
  relatedComment: one(comments, {
    fields: [notifications.relatedCommentId],
    references: [comments.id],
  }),
  relatedEventComment: one(eventComments, {
    fields: [notifications.relatedEventCommentId],
    references: [eventComments.id],
  }),
  relatedParticipant: one(eventParticipants, {
    fields: [notifications.relatedParticipantId],
    references: [eventParticipants.id],
  }),
}));
