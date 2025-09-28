-- Phase 2: Backfill normalized tables from existing JSONB in user_groceries.groceries
-- SAFETY: Non-destructive; inserts if not present. Assumes Phase 1 tables exist.

-- 1) Seed ingredient_categories from existing JSONB keys (category slugs)
--    Use snake_case key as slug and a titleized name for display.
with category_slugs as (
  select distinct key as slug
  from public.user_groceries ug,
       lateral jsonb_object_keys(coalesce(ug.groceries, '{}'::jsonb)) as key
)
insert into public.ingredient_categories (slug, name)
select cs.slug,
       initcap(replace(cs.slug, '_', ' ')) as name
from category_slugs cs
on conflict (slug) do nothing;

-- 2) Seed global_ingredients from all unique ingredient strings across all categories
with all_pairs as (
  select k.key as category_slug, v.value as ingredient_text
  from public.user_groceries ug,
       lateral jsonb_each(coalesce(ug.groceries, '{}'::jsonb)) as k(key, arr),
       lateral jsonb_array_elements_text(k.arr) as v(value)
),
all_ingredients as (
  select distinct trim(ingredient_text) as name
  from all_pairs
),
normalized as (
  select nullif(trim(name), '') as name,
         nullif(trim(lower(name)), '') as normalized_name
  from all_ingredients
)
insert into public.global_ingredients (name, normalized_name)
select n.name, n.normalized_name
from normalized n
where n.name is not null
  and not exists (
    select 1 from public.global_ingredients gi where gi.name = n.name
  );

-- 3) Seed ingredient_category_assignments for every occurrence in JSONB
with pairs as (
  select distinct
         trim(v.value::text, '"') as ingredient_name,
         k.key as category_slug
  from public.user_groceries ug,
       lateral jsonb_each(coalesce(ug.groceries, '{}'::jsonb)) as k(key, arr),
       lateral jsonb_array_elements_text(k.arr) as v(value)
),
resolved as (
  select gi.id as ingredient_id,
         ic.id as category_id
  from pairs p
  join public.global_ingredients gi on gi.name = p.ingredient_name
  join public.ingredient_categories ic on ic.slug = p.category_slug
)
insert into public.ingredient_category_assignments (ingredient_id, category_id)
select r.ingredient_id, r.category_id
from resolved r
on conflict (ingredient_id, category_id) do nothing;

-- Notes:
-- - This migration reads from current user_groceries.groceries JSONB to populate normalized tables.
-- - It does not modify user_groceries. Future phases can migrate reads to the normalized model.


