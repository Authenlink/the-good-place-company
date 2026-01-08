-- Migration: Add events and event_participants tables

CREATE TABLE IF NOT EXISTS "events" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"event_type" text NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp,
	"location" text,
	"address" text,
	"city" text,
	"coordinates" jsonb,
	"images" jsonb,
	"max_participants" integer,
	"recurrence" text DEFAULT 'none',
	"recurrence_end_date" timestamp,
	"status" text DEFAULT 'draft' NOT NULL,
	"company_id" integer NOT NULL REFERENCES "companies"("id") ON DELETE CASCADE,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "event_participants" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer NOT NULL REFERENCES "events"("id") ON DELETE CASCADE,
	"user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
	"status" text DEFAULT 'confirmed' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS "events_company_id_idx" ON "events" ("company_id");
CREATE INDEX IF NOT EXISTS "events_start_date_idx" ON "events" ("start_date");
CREATE INDEX IF NOT EXISTS "events_status_idx" ON "events" ("status");
CREATE INDEX IF NOT EXISTS "event_participants_event_id_idx" ON "event_participants" ("event_id");
CREATE INDEX IF NOT EXISTS "event_participants_user_id_idx" ON "event_participants" ("user_id");

-- Unique constraint to prevent duplicate registrations
CREATE UNIQUE INDEX IF NOT EXISTS "event_participants_unique_idx" ON "event_participants" ("event_id", "user_id");

