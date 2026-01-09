-- Migration: Add user profile fields
-- Created: 2026-01-09

ALTER TABLE "users" ADD COLUMN "bio" text;
ALTER TABLE "users" ADD COLUMN "location" text;
ALTER TABLE "users" ADD COLUMN "website" text;
ALTER TABLE "users" ADD COLUMN "banner" text;
