-- Migration: Add cover_image column to events table

ALTER TABLE events ADD COLUMN cover_image text;
