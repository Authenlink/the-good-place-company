-- Table company_followers pour les abonnements aux entreprises
CREATE TABLE IF NOT EXISTS "company_followers" (
  "id" SERIAL PRIMARY KEY,
  "company_id" INTEGER NOT NULL REFERENCES "companies"("id") ON DELETE CASCADE,
  "user_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
  CONSTRAINT "company_followers_unique" UNIQUE("company_id", "user_id")
);

-- Index pour améliorer les performances des requêtes
CREATE INDEX IF NOT EXISTS "company_followers_company_id_idx" ON "company_followers"("company_id");
CREATE INDEX IF NOT EXISTS "company_followers_user_id_idx" ON "company_followers"("user_id");
CREATE INDEX IF NOT EXISTS "company_followers_created_at_idx" ON "company_followers"("created_at");

