-- Migration: Add extended fields to events table

-- Champs pour événements payants / collecte de fonds
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "is_paid" boolean DEFAULT false;
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "price" numeric(10, 2);
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "currency" text DEFAULT 'EUR';
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "fundraising_goal" numeric(10, 2);

-- Informations supplémentaires
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "requirements" text;
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "target_audience" text;
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "contact_email" text;
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "contact_phone" text;
ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "external_link" text;

