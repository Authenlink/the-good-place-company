-- Migration: Add missions column to event_slots (support for multiple missions per slot)

-- Add missions column (JSONB array)
ALTER TABLE "event_slots" ADD COLUMN IF NOT EXISTS "missions" jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Migrate existing data: convert mission_type and mission_description to missions array
UPDATE "event_slots" 
SET "missions" = jsonb_build_array(
  jsonb_build_object(
    'type', COALESCE("mission_type", 'autre'),
    'description', "mission_description",
    'maxParticipants', COALESCE("max_participants", 10)
  )
)
WHERE "missions" = '[]'::jsonb OR "missions" IS NULL;
