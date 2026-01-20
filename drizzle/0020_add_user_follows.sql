-- Table user_follows pour les abonnements entre utilisateurs
CREATE TABLE IF NOT EXISTS "user_follows" (
  "id" SERIAL PRIMARY KEY,
  "follower_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "following_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
  CONSTRAINT "user_follows_unique" UNIQUE("follower_id", "following_id"),
  CONSTRAINT "user_follows_no_self_follow" CHECK ("follower_id" != "following_id")
);

-- Index pour améliorer les performances des requêtes
CREATE INDEX IF NOT EXISTS "user_follows_follower_id_idx" ON "user_follows"("follower_id");
CREATE INDEX IF NOT EXISTS "user_follows_following_id_idx" ON "user_follows"("following_id");
CREATE INDEX IF NOT EXISTS "user_follows_created_at_idx" ON "user_follows"("created_at");
