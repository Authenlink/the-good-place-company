-- Migration: Add validated field to events table

ALTER TABLE "events" ADD COLUMN "validated" boolean;
