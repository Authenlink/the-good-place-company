-- Migration: Add referenced_city column to users table

-- Add referenced_city column to users table
ALTER TABLE users ADD COLUMN referenced_city text;
