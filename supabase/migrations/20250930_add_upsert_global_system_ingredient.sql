-- Unique index to ensure idempotent upserts by normalized_name
create unique index if not exists idx_global_ingredients_normalized_name
  on public.global_ingredients (normalized_name);

-- Upsert RPC for system ingredients created from cuisine staples
create or replace function public.upsert_global_system_ingredient(
  p_name text,
  p_normalized_name text,
  p_category text
) returns uuid
language plpgsql
security definer
set search_path = public as $$
declare
  v_id uuid;
begin
  insert into public.global_ingredients (
    name,
    normalized_name,
    category,
    synonyms,
    usage_count,
    is_verified,
    is_system
  ) values (
    p_name,
    p_normalized_name,
    p_category,
    '{}'::text[],
    1,
    false,
    true
  )
  on conflict (normalized_name) do update set
    category = excluded.category,
    updated_at = now(),
    is_system = true
  returning id into v_id;

  return v_id;
end; $$;

-- Allow anon and authenticated roles to call the function from browser
grant execute on function public.upsert_global_system_ingredient(text,text,text) to anon;
grant execute on function public.upsert_global_system_ingredient(text,text,text) to authenticated;


