import { supabase } from '@/lib/supabase';

function normalizeName(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function upsertSystemIngredient(
  name: string,
  category: string
): Promise<string | null> {
  const normalized = normalizeName(name);
  const { data, error } = await supabase.rpc(
    'upsert_global_system_ingredient',
    {
      p_name: name,
      p_normalized_name: normalized,
      p_category: category,
    }
  );
  if (error) {
    // Surface but do not throw to avoid blocking user flows
    // Callers may choose to continue adding to shopping list
    console.warn('upsertSystemIngredient failed:', error);
    return null;
  }
  return data as string | null;
}
