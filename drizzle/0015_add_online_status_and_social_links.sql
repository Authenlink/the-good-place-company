-- Migration: Add online status and social media links to users and companies tables

-- Add columns to users table
ALTER TABLE users ADD COLUMN is_online boolean DEFAULT false;
ALTER TABLE users ADD COLUMN instagram_url text;
ALTER TABLE users ADD COLUMN tiktok_url text;
ALTER TABLE users ADD COLUMN linkedin_url text;

-- Add columns to companies table
ALTER TABLE companies ADD COLUMN is_online boolean DEFAULT false;
ALTER TABLE companies ADD COLUMN instagram_url text;
ALTER TABLE companies ADD COLUMN tiktok_url text;
ALTER TABLE companies ADD COLUMN linkedin_url text;
