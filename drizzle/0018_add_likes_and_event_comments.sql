-- Migration: Add likes and event comments tables

-- Table post_likes pour les likes sur les posts
CREATE TABLE IF NOT EXISTS "post_likes" (
  "id" SERIAL PRIMARY KEY,
  "post_id" INTEGER NOT NULL REFERENCES "posts"("id") ON DELETE CASCADE,
  "user_id" INTEGER REFERENCES "users"("id") ON DELETE CASCADE,
  "company_id" INTEGER REFERENCES "companies"("id") ON DELETE CASCADE,
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
  CONSTRAINT "post_likes_unique" UNIQUE("post_id", "user_id", "company_id")
);

-- Table event_likes pour les likes sur les événements
CREATE TABLE IF NOT EXISTS "event_likes" (
  "id" SERIAL PRIMARY KEY,
  "event_id" INTEGER NOT NULL REFERENCES "events"("id") ON DELETE CASCADE,
  "user_id" INTEGER REFERENCES "users"("id") ON DELETE CASCADE,
  "company_id" INTEGER REFERENCES "companies"("id") ON DELETE CASCADE,
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
  CONSTRAINT "event_likes_unique" UNIQUE("event_id", "user_id", "company_id")
);

-- Table event_comments pour les commentaires sur les événements
CREATE TABLE IF NOT EXISTS "event_comments" (
  "id" SERIAL PRIMARY KEY,
  "content" TEXT NOT NULL,
  "event_id" INTEGER NOT NULL REFERENCES "events"("id") ON DELETE CASCADE,
  "user_id" INTEGER REFERENCES "users"("id") ON DELETE CASCADE,
  "company_id" INTEGER REFERENCES "companies"("id") ON DELETE CASCADE,
  "parent_id" INTEGER REFERENCES "event_comments"("id") ON DELETE CASCADE,
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Index pour améliorer les performances des requêtes
CREATE INDEX IF NOT EXISTS "post_likes_post_id_idx" ON "post_likes"("post_id");
CREATE INDEX IF NOT EXISTS "post_likes_user_id_idx" ON "post_likes"("user_id");
CREATE INDEX IF NOT EXISTS "post_likes_company_id_idx" ON "post_likes"("company_id");

CREATE INDEX IF NOT EXISTS "event_likes_event_id_idx" ON "event_likes"("event_id");
CREATE INDEX IF NOT EXISTS "event_likes_user_id_idx" ON "event_likes"("user_id");
CREATE INDEX IF NOT EXISTS "event_likes_company_id_idx" ON "event_likes"("company_id");

CREATE INDEX IF NOT EXISTS "event_comments_event_id_idx" ON "event_comments"("event_id");
CREATE INDEX IF NOT EXISTS "event_comments_user_id_idx" ON "event_comments"("user_id");
CREATE INDEX IF NOT EXISTS "event_comments_company_id_idx" ON "event_comments"("company_id");
CREATE INDEX IF NOT EXISTS "event_comments_parent_id_idx" ON "event_comments"("parent_id");
CREATE INDEX IF NOT EXISTS "event_comments_created_at_idx" ON "event_comments"("created_at");
