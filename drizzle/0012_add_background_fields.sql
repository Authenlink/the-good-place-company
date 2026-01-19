-- Migration: Add background fields to events, users, and companies tables

-- Add background fields to events table
ALTER TABLE events ADD COLUMN background_type text;
ALTER TABLE events ADD COLUMN background_image_index integer;
ALTER TABLE events ADD COLUMN background_gradient jsonb;

-- Add background fields to users table
ALTER TABLE users ADD COLUMN background_type text;
ALTER TABLE users ADD COLUMN background_gradient jsonb;

-- Add background fields to companies table
ALTER TABLE companies ADD COLUMN background_type text;
ALTER TABLE companies ADD COLUMN background_gradient jsonb;
