-- Create ingredient_aliases table for matching alternate names to canonical ingredients
-- Non-destructive; uses IF NOT EXISTS and additive indexes/constraints

create table if not exists public.ingredient_aliases (
  id uuid primary key default gen_random_uuid(),
  ingredient_id uuid not null references public.global_ingredients(id) on delete cascade,
  alias text not null,
  normalized_alias text not null,
  source text, -- optional (e.g., user, importer, system)
  created_at timestamptz not null default now(),
  unique (ingredient_id, normalized_alias)
);

-- Indexes to speed lookups
create index if not exists idx_ingredient_aliases_normalized_alias on public.ingredient_aliases (normalized_alias);
create index if not exists idx_ingredient_aliases_ingredient_id on public.ingredient_aliases (ingredient_id);

comment on table public.ingredient_aliases is 'Alternate names/synonyms mapped to canonical global_ingredients.';
comment on column public.ingredient_aliases.normalized_alias is 'Lowercased/trimmed alias for deterministic matching.';


