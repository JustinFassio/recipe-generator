export function resolveCategoryForIngredient(
  ingredient: string,
  currentCategory: string,
  groceries: Record<string, string[]>,
  map?: Map<string, string>
): string | null {
  if (currentCategory !== 'all') return currentCategory;
  const fromMap = map?.get(ingredient);
  if (fromMap) return fromMap;
  const fromScan = Object.entries(groceries).find(([, items]) =>
    items?.includes(ingredient)
  )?.[0];
  return fromScan ?? null;
}
