-- Migration: Add recurrence_group_id column to events table

ALTER TABLE events ADD COLUMN recurrence_group_id integer;

-- Add foreign key constraint referencing events.id with cascade delete
ALTER TABLE events ADD CONSTRAINT events_recurrence_group_id_fkey 
  FOREIGN KEY (recurrence_group_id) REFERENCES events(id) ON DELETE CASCADE;
