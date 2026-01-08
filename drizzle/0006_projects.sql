-- Table des tags de projets prédéfinis
CREATE TABLE IF NOT EXISTS "project_tags" (
  "id" SERIAL PRIMARY KEY,
  "key" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "color" TEXT NOT NULL,
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Table des projets
CREATE TABLE IF NOT EXISTS "projects" (
  "id" SERIAL PRIMARY KEY,
  "title" TEXT NOT NULL,
  "short_description" TEXT,
  "full_description" TEXT,
  "banner_image" TEXT,
  "carousel_images" JSONB,
  "objectives" TEXT,
  "achievements" TEXT,
  "impact" TEXT,
  "tags" JSONB,
  "custom_tags" JSONB,
  "contact_email" TEXT,
  "contact_phone" TEXT,
  "external_link" TEXT,
  "status" TEXT NOT NULL DEFAULT 'active',
  "company_id" INTEGER NOT NULL REFERENCES "companies"("id") ON DELETE CASCADE,
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Index pour améliorer les performances des requêtes
CREATE INDEX IF NOT EXISTS "projects_company_id_idx" ON "projects"("company_id");
CREATE INDEX IF NOT EXISTS "projects_status_idx" ON "projects"("status");

-- Insertion des tags prédéfinis
INSERT INTO "project_tags" ("key", "name", "color") VALUES
  ('humanitaire', 'Humanitaire', 'bg-red-500'),
  ('ecologie', 'Écologie', 'bg-green-500'),
  ('education', 'Éducation', 'bg-blue-500'),
  ('sante', 'Santé', 'bg-pink-500'),
  ('culture', 'Culture', 'bg-purple-500'),
  ('sport', 'Sport', 'bg-orange-500'),
  ('insertion', 'Insertion', 'bg-teal-500'),
  ('solidarite', 'Solidarité', 'bg-amber-500'),
  ('animaux', 'Animaux', 'bg-lime-500'),
  ('international', 'International', 'bg-cyan-500')
ON CONFLICT ("key") DO NOTHING;

