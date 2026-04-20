-- Mark existing migrations as already applied
-- Run this SQL in your database (Navicat/psql)

-- First, create the migrations table if it doesn't exist
CREATE TABLE IF NOT EXISTS "__drizzle_migrations" (
    id SERIAL PRIMARY KEY,
    hash text NOT NULL,
    created_at bigint
);

-- Insert records for migrations that have already been applied
-- Migration 0000 - Initial schema
INSERT INTO "__drizzle_migrations" (hash, created_at)
SELECT '0000_colossal_bishop', 1766911687391
WHERE NOT EXISTS (SELECT 1 FROM "__drizzle_migrations" WHERE hash = '0000_colossal_bishop');

-- Migration 0001 - Added more tables including password_resets
INSERT INTO "__drizzle_migrations" (hash, created_at)
SELECT '0001_shiny_otto_octavius', 1767510451473
WHERE NOT EXISTS (SELECT 1 FROM "__drizzle_migrations" WHERE hash = '0001_shiny_otto_octavius');

-- Verify
SELECT * FROM "__drizzle_migrations";
