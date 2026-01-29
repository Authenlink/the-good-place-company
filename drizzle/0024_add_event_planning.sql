-- Migration: Add event planning system (slots and slot participants)

-- Create event_slots table FIRST (before adding foreign key reference)
CREATE TABLE IF NOT EXISTS "event_slots" (
	"id" serial PRIMARY KEY NOT NULL,
	"event_id" integer NOT NULL REFERENCES "events"("id") ON DELETE CASCADE,
	"start_time" timestamp NOT NULL,
	"end_time" timestamp NOT NULL,
	"max_participants" integer NOT NULL,
	"missions" jsonb NOT NULL DEFAULT '[]'::jsonb,
	"mission_type" text,
	"mission_description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Create event_slot_participants table
CREATE TABLE IF NOT EXISTS "event_slot_participants" (
	"id" serial PRIMARY KEY NOT NULL,
	"slot_id" integer NOT NULL REFERENCES "event_slots"("id") ON DELETE CASCADE,
	"participant_id" integer REFERENCES "event_participants"("id") ON DELETE CASCADE,
	"prefilled_name" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);

-- Add slot_id column to event_participants AFTER event_slots table exists
ALTER TABLE "event_participants" ADD COLUMN IF NOT EXISTS "slot_id" integer REFERENCES "event_slots"("id") ON DELETE SET NULL;

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS "event_slots_event_id_idx" ON "event_slots" ("event_id");
CREATE INDEX IF NOT EXISTS "event_slots_start_time_idx" ON "event_slots" ("start_time");
CREATE INDEX IF NOT EXISTS "event_slot_participants_slot_id_idx" ON "event_slot_participants" ("slot_id");
CREATE INDEX IF NOT EXISTS "event_slot_participants_participant_id_idx" ON "event_slot_participants" ("participant_id");
CREATE INDEX IF NOT EXISTS "event_participants_slot_id_idx" ON "event_participants" ("slot_id");
