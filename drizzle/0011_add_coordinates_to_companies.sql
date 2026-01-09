-- Migration: Add coordinates column to companies table
ALTER TABLE companies ADD COLUMN coordinates jsonb;
