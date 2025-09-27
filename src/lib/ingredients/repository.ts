import { supabase } from '@/lib/supabase';

export interface Ingredient {
  id: string;
  name: string;
}

export interface IngredientCategory {
  id: string;
  name: string;
  slug: string;
}

function normalize(input: string): string {
  return input.trim().toLowerCase();
}

async function getCategoriesFromNormalized(): Promise<IngredientCategory[]> {
  const { data, error } = await supabase
    .from('ingredient_categories')
    .select('id,name,slug')
    .order('name', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

async function getCategoriesFromJsonbFallback(): Promise<IngredientCategory[]> {
  // Build categories from distinct JSONB keys across user_groceries
  const { data, error } = await supabase
    .from('user_groceries')
    .select('groceries');
  if (error) throw error;
  const slugs = new Set<string>();
  for (const row of data ?? []) {
    const groceries =
      (row as { groceries?: Record<string, string[]> }).groceries ?? {};
    for (const key of Object.keys(groceries)) slugs.add(key);
  }
  return Array.from(slugs)
    .sort()
    .map((slug) => ({
      id: slug,
      slug,
      name: slug.replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase()),
    }));
}

export async function getCategories(): Promise<IngredientCategory[]> {
  const normalized = await getCategoriesFromNormalized();
  if (normalized.length > 0) return normalized;
  return await getCategoriesFromJsonbFallback();
}

async function getAllIngredientsFromNormalized(): Promise<Ingredient[]> {
  const { data, error } = await supabase
    .from('global_ingredients')
    .select('id,name')
    .order('name', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

async function getAllIngredientsFromJsonbFallback(): Promise<Ingredient[]> {
  const { data, error } = await supabase
    .from('user_groceries')
    .select('groceries');
  if (error) throw error;
  const names = new Set<string>();
  for (const row of data ?? []) {
    const groceries =
      (row as { groceries?: Record<string, string[]> }).groceries ?? {};
    for (const list of Object.values(groceries)) {
      for (const item of list ?? []) names.add(item);
    }
  }
  return Array.from(names)
    .sort()
    .map((name) => ({ id: name, name }));
}

export async function getAllIngredients(): Promise<Ingredient[]> {
  const normalized = await getAllIngredientsFromNormalized();
  if (normalized.length > 0) return normalized;
  return await getAllIngredientsFromJsonbFallback();
}

export async function getIngredientsByCategorySlug(
  slug: string
): Promise<Ingredient[]> {
  // Try normalized join first
  const { data, error } = await supabase
    .from('ingredient_category_assignments')
    .select('global_ingredients(id,name), ingredient_categories!inner(slug)')
    .eq('ingredient_categories.slug', slug);
  if (error && error.code !== 'PGRST116') throw error; // ignore relation errors if table missing
  if (data && data.length > 0) {
    return (data as unknown as Array<{ global_ingredients: Ingredient }>)
      .map((r) => r.global_ingredients)
      .filter((ingredient): ingredient is Ingredient => ingredient != null);
  }

  // Fallback to JSONB bucket
  const { data: jb, error: jbError } = await supabase
    .from('user_groceries')
    .select('groceries');
  if (jbError) throw jbError;
  const names = new Set<string>();
  for (const row of jb ?? []) {
    const groceries =
      (row as { groceries?: Record<string, string[]> }).groceries ?? {};
    for (const item of groceries[slug] ?? []) names.add(item);
  }
  return Array.from(names)
    .sort()
    .map((name) => ({ id: name, name }));
}

export async function resolveIngredientByNameOrAlias(
  input: string
): Promise<Ingredient | null> {
  const n = normalize(input);

  // 1) Exact alias match
  const { data: aliasMatch, error: aliasErr } = await supabase
    .from('ingredient_aliases')
    .select('ingredient_id, global_ingredients:ingredient_id(id,name)')
    .eq('normalized_alias', n)
    .limit(1)
    .maybeSingle();
  if (aliasErr && aliasErr.code !== 'PGRST116') throw aliasErr;
  if (
    aliasMatch &&
    (aliasMatch as Record<string, unknown>).global_ingredients
  ) {
    const gi = (aliasMatch as Record<string, unknown>)
      .global_ingredients as Ingredient;
    return gi;
  }

  // 2) Exact ingredient name (case-insensitive)
  const { data: ing, error: ingErr } = await supabase
    .from('global_ingredients')
    .select('id,name')
    .ilike('name', n)
    .limit(1)
    .maybeSingle();
  if (ingErr && ingErr.code !== 'PGRST116') throw ingErr;
  if (ing) return ing;

  return null;
}
