-- Seed data for local development.
-- This file runs automatically after migrations during `supabase db reset`.
-- Keep it idempotent using stable IDs and ON CONFLICT upserts.

begin;

-- Recipes are now seeded via migration 20250819000001_seed_recipes_with_users.sql
-- to ensure proper user associations after users are created

commit;


