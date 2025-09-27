-- Phase 1: Introduce normalized ingredient/category tables (non-destructive)
-- SAFETY: Uses IF NOT EXISTS; does not alter or drop existing tables/columns.
-- Intent: Prepare many-to-many mapping without impacting current JSONB usage.

-- Enable pgcrypto for gen_random_uuid if not already enabled (safe no-op if exists)
create extension if not exists pgcrypto;

-- Category master table
create table if not exists public.ingredient_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);

-- Ingredient master table
create table if not exists public.global_ingredients (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  created_at timestamptz not null default now()
);

-- Junction table for many-to-many relationships
create table if not exists public.ingredient_category_assignments (
  ingredient_id uuid not null references public.global_ingredients(id) on delete cascade,
  category_id uuid not null references public.ingredient_categories(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (ingredient_id, category_id)
);

-- Helpful indexes (IF NOT EXISTS to be non-destructive)
create index if not exists idx_ingredient_categories_slug on public.ingredient_categories (slug);
create index if not exists idx_global_ingredients_name on public.global_ingredients (name);
create index if not exists idx_assignments_ingredient on public.ingredient_category_assignments (ingredient_id);
create index if not exists idx_assignments_category on public.ingredient_category_assignments (category_id);

-- OPTIONAL: Comment on tables for clarity
comment on table public.global_ingredients is 'Master list of unique ingredients (normalized).';
comment on table public.ingredient_categories is 'Master list of ingredient categories (normalized).';
comment on table public.ingredient_category_assignments is 'Many-to-many mapping of ingredients to categories.';


