-- Migration: Add user_company_memberships table

CREATE TABLE IF NOT EXISTS "user_company_memberships" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "company_id" INTEGER NOT NULL REFERENCES "companies"("id") ON DELETE CASCADE,
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
  CONSTRAINT "user_company_memberships_unique" UNIQUE("user_id", "company_id")
);

-- Index pour améliorer les performances des requêtes
CREATE INDEX IF NOT EXISTS "user_company_memberships_user_id_idx" ON "user_company_memberships"("user_id");
CREATE INDEX IF NOT EXISTS "user_company_memberships_company_id_idx" ON "user_company_memberships"("company_id");
CREATE INDEX IF NOT EXISTS "user_company_memberships_created_at_idx" ON "user_company_memberships"("created_at");
