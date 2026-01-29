-- Migration: Add member_type column to user_company_memberships table

ALTER TABLE "user_company_memberships" 
ADD COLUMN IF NOT EXISTS "member_type" TEXT DEFAULT 'volunteer' NOT NULL;

-- Mettre à jour les membres existants avec la valeur par défaut
UPDATE "user_company_memberships" 
SET "member_type" = 'volunteer' 
WHERE "member_type" IS NULL;

-- Index pour améliorer les performances des requêtes filtrées par type
CREATE INDEX IF NOT EXISTS "user_company_memberships_member_type_idx" ON "user_company_memberships"("member_type");
