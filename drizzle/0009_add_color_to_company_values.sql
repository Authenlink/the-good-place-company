-- Migration: Add color column to company_values
-- Created: 2026-01-09

ALTER TABLE "company_values" ADD COLUMN "color" text NOT NULL DEFAULT 'bg-gray-500';
