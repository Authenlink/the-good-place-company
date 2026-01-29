-- Migration: Add mission_type column to event_slot_participants

-- Add mission_type column (nullable for backward compatibility)
ALTER TABLE "event_slot_participants" ADD COLUMN IF NOT EXISTS "mission_type" text;

-- Create composite index for better query performance when counting participants by slot and mission
CREATE INDEX IF NOT EXISTS "event_slot_participants_slot_id_mission_type_idx" 
ON "event_slot_participants" ("slot_id", "mission_type");
