-- Migration: Add comment likes tables

-- Table comment_likes pour les likes sur les commentaires de posts
CREATE TABLE IF NOT EXISTS "comment_likes" (
  "id" SERIAL PRIMARY KEY,
  "comment_id" INTEGER NOT NULL REFERENCES "comments"("id") ON DELETE CASCADE,
  "user_id" INTEGER REFERENCES "users"("id") ON DELETE CASCADE,
  "company_id" INTEGER REFERENCES "companies"("id") ON DELETE CASCADE,
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
  CONSTRAINT "comment_likes_unique" UNIQUE("comment_id", "user_id", "company_id")
);

-- Table event_comment_likes pour les likes sur les commentaires d'événements
CREATE TABLE IF NOT EXISTS "event_comment_likes" (
  "id" SERIAL PRIMARY KEY,
  "event_comment_id" INTEGER NOT NULL REFERENCES "event_comments"("id") ON DELETE CASCADE,
  "user_id" INTEGER REFERENCES "users"("id") ON DELETE CASCADE,
  "company_id" INTEGER REFERENCES "companies"("id") ON DELETE CASCADE,
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
  CONSTRAINT "event_comment_likes_unique" UNIQUE("event_comment_id", "user_id", "company_id")
);

-- Index pour améliorer les performances des requêtes
CREATE INDEX IF NOT EXISTS "comment_likes_comment_id_idx" ON "comment_likes"("comment_id");
CREATE INDEX IF NOT EXISTS "comment_likes_user_id_idx" ON "comment_likes"("user_id");
CREATE INDEX IF NOT EXISTS "comment_likes_company_id_idx" ON "comment_likes"("company_id");

CREATE INDEX IF NOT EXISTS "event_comment_likes_event_comment_id_idx" ON "event_comment_likes"("event_comment_id");
CREATE INDEX IF NOT EXISTS "event_comment_likes_user_id_idx" ON "event_comment_likes"("user_id");
CREATE INDEX IF NOT EXISTS "event_comment_likes_company_id_idx" ON "event_comment_likes"("company_id");
