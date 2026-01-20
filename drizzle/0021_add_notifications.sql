-- Migration: Add notifications table

CREATE TABLE IF NOT EXISTS "notifications" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "type" TEXT NOT NULL,
  "related_user_id" INTEGER REFERENCES "users"("id") ON DELETE SET NULL,
  "related_company_id" INTEGER REFERENCES "companies"("id") ON DELETE SET NULL,
  "related_post_id" INTEGER REFERENCES "posts"("id") ON DELETE CASCADE,
  "related_event_id" INTEGER REFERENCES "events"("id") ON DELETE CASCADE,
  "related_comment_id" INTEGER REFERENCES "comments"("id") ON DELETE CASCADE,
  "related_event_comment_id" INTEGER REFERENCES "event_comments"("id") ON DELETE CASCADE,
  "related_participant_id" INTEGER REFERENCES "event_participants"("id") ON DELETE CASCADE,
  "message" TEXT NOT NULL,
  "read" BOOLEAN DEFAULT FALSE NOT NULL,
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Index pour améliorer les performances des requêtes
CREATE INDEX IF NOT EXISTS "notifications_user_id_idx" ON "notifications"("user_id");
CREATE INDEX IF NOT EXISTS "notifications_read_idx" ON "notifications"("read");
CREATE INDEX IF NOT EXISTS "notifications_created_at_idx" ON "notifications"("created_at");
CREATE INDEX IF NOT EXISTS "notifications_user_read_idx" ON "notifications"("user_id", "read");
CREATE INDEX IF NOT EXISTS "notifications_type_idx" ON "notifications"("type");
