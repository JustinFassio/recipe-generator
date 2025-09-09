import { useMemo, useState } from 'react';
import { useGlobalIngredients } from '@/hooks/useGlobalIngredients';
// no matcher needed here; use a simple UI normalizer aligned with matcher semantics
import { useGroceries } from '@/hooks/useGroceries';
import { createDaisyUICardClasses } from '@/lib/card-migration';
import { Button } from '@/components/ui/button';
import { Search, Plus, Check, RefreshCw, Trash2, Shield } from 'lucide-react';
import { GROCERY_CATEGORIES } from '@/lib/groceries/categories';
import type { GlobalIngredient } from '@/lib/groceries/enhanced-ingredient-matcher';

export default function GlobalIngredientsPage() {
  const {
    globalIngredients,
    hiddenNormalizedNames,
    loading,
    error,
    refreshGlobalIngredients,
    hideIngredient,
    unhideIngredient,
  } = useGlobalIngredients();
  const groceries = useGroceries();
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const grouped = useMemo(() => {
    const items = globalIngredients
      .filter(
        (g) =>
          !query.trim() || g.name.toLowerCase().includes(query.toLowerCase())
      )
      .filter((g) =>
        activeCategory === 'all' ? true : g.category === activeCategory
      );

    const map: Record<string, GlobalIngredient[]> = {};
    items.forEach((g) => {
      if (!map[g.category]) map[g.category] = [];
      map[g.category].push(g);
    });
    return map;
  }, [globalIngredients, query, activeCategory]);

  // lightweight normalizer only for UI comparisons
  const normalizeName = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  // REAL fix: build a normalized set of ALL user groceries using the same normalizer
  const userNormalizedSet = useMemo(() => {
    const set = new Set<string>();
    const g: Record<string, string[]> = (groceries.groceries || {}) as Record<
      string,
      string[]
    >;
    Object.values(g).forEach((arr) => {
      (arr || []).forEach((item) => {
        set.add(normalizeName(item));
      });
    });
    return set;
  }, [groceries.groceries]);

  const handleAddToGroceries = async (category: string, name: string) => {
    // Add exactly what the user clicked (alias allowed), do not canonicalize
    // Use addIngredients to add as unselected staple (not active)
    groceries.addIngredients(category, [name]);
    await groceries.saveGroceries();
  };

  const handleRemoveFromGroceries = async (name: string) => {
    // Remove this name from any category in the user's staples
    const updated: Record<string, string[]> = {
      ...(groceries.groceries || {}),
    } as Record<string, string[]>;
    let changed = false;
    Object.keys(updated).forEach((cat) => {
      const before = updated[cat] || [];
      const after = before.filter((i) => i !== name);
      if (after.length !== before.length) {
        updated[cat] = after;
        changed = true;
      }
    });
    if (changed) {
      // Use existing API: toggle calls setState; here we persist via saveGroceries after setting state
      // We can't directly set groceries.groceries here, so we simulate by removing via toggle where present
      Object.keys(groceries.groceries || {}).forEach((cat) => {
        const arr = (groceries.groceries as Record<string, string[]>)[
          cat
        ] as string[];
        if (arr?.includes(name)) groceries.toggleIngredient(cat, name);
      });
      await groceries.saveGroceries();
    }
  };

  const handleToggleHidden = async (name: string, normalized: string) => {
    if (hiddenNormalizedNames.has(normalized)) {
      await unhideIngredient(name);
    } else {
      await hideIngredient(name);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-teal-50">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Global Ingredients
            </h1>
            <p className="text-gray-600">
              Browse community-saved ingredients and add them to your groceries.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search ingredients..."
                className="input input-bordered pl-8 input-sm w-64"
              />
            </div>
            <Button
              variant="outline"
              onClick={refreshGlobalIngredients}
              disabled={loading}
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`}
              />{' '}
              Refresh
            </Button>
          </div>
        </div>

        {error && (
          <div className="alert alert-error mb-4">
            <span>{error}</span>
          </div>
        )}

        <div className={createDaisyUICardClasses('bordered mb-6')}>
          <div className="card-body p-4">
            <div className="tabs tabs-boxed overflow-x-auto">
              <button
                className={`tab ${activeCategory === 'all' ? 'tab-active' : ''}`}
                onClick={() => setActiveCategory('all')}
              >
                All
              </button>
              {Object.entries(GROCERY_CATEGORIES).map(([key, val]) => (
                <button
                  key={key}
                  className={`tab ${activeCategory === key ? 'tab-active' : ''}`}
                  onClick={() => setActiveCategory(key)}
                >
                  <span className="flex items-center space-x-2">
                    <span>{val.icon}</span>
                    <span className="hidden sm:inline">{val.name}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className={createDaisyUICardClasses('bordered')}>
            <div className="card-body">
              <div className="animate-pulse text-gray-500">
                Loading global ingredients…
              </div>
            </div>
          </div>
        ) : Object.keys(grouped).length === 0 ? (
          <div className={createDaisyUICardClasses('bordered')}>
            <div className="card-body text-gray-600">No ingredients found.</div>
          </div>
        ) : (
          Object.entries(grouped).map(([category, items]) => {
            const categoryMeta =
              GROCERY_CATEGORIES[category as keyof typeof GROCERY_CATEGORIES];
            return (
              <div
                key={category}
                className={createDaisyUICardClasses('bordered mb-6')}
              >
                <div className="card-body">
                  <h2 className="card-title mb-2">
                    {categoryMeta?.icon} {categoryMeta?.name || category}
                    <span className="text-sm font-normal text-gray-500">
                      {' '}
                      ({items.length})
                    </span>
                  </h2>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                    {items.map((ing) => {
                      // In-catalog if: system & not hidden OR user staples contain canonical or any synonym
                      const hasCanonical = userNormalizedSet.has(
                        ing.normalized_name
                      );
                      const hasSynonym = (ing.synonyms || []).some(
                        (syn: string) =>
                          userNormalizedSet.has(normalizeName(syn))
                      );
                      const isInCatalog =
                        (ing.is_system &&
                          !hiddenNormalizedNames.has(ing.normalized_name)) ||
                        hasCanonical ||
                        hasSynonym;
                      const isHidden = hiddenNormalizedNames.has(
                        ing.normalized_name
                      );
                      return (
                        <div
                          key={ing.id}
                          className="flex items-center justify-between rounded border p-2 bg-white"
                        >
                          <div className="min-w-0">
                            <div className="font-medium truncate flex items-center gap-2">
                              <span className="truncate">{ing.name}</span>
                              {ing.is_system && isHidden && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-red-600 p-0 h-auto min-h-0"
                                  onClick={() =>
                                    handleToggleHidden(
                                      ing.name,
                                      ing.normalized_name
                                    )
                                  }
                                >
                                  <Trash2 className="h-3 w-3 mr-1" /> Restore
                                </Button>
                              )}
                            </div>
                            {ing.synonyms?.length > 0 && (
                              <div className="text-xs text-gray-500 truncate">
                                aka: {ing.synonyms.slice(0, 2).join(', ')}
                                {ing.synonyms.length > 2 ? '…' : ''}
                              </div>
                            )}
                            {(ing.is_system || isHidden) && (
                              <div className="mt-1 flex items-center gap-2">
                                {ing.is_system && (
                                  <span className="inline-flex items-center text-[10px] px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                                    <Shield className="h-3 w-3 mr-1" /> System
                                  </span>
                                )}
                                {isHidden && (
                                  <span className="inline-flex items-center text-[10px] px-1.5 py-0.5 rounded bg-gray-50 text-gray-700 border border-gray-200">
                                    Hidden
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            {ing.is_system && !isHidden && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-red-600"
                                onClick={() =>
                                  handleToggleHidden(
                                    ing.name,
                                    ing.normalized_name
                                  )
                                }
                              >
                                <Trash2 className="h-3 w-3" />{' '}
                                {hiddenNormalizedNames.has(ing.normalized_name)
                                  ? 'Restore'
                                  : 'Remove'}
                              </Button>
                            )}
                            {!ing.is_system && isInCatalog && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-red-600"
                                onClick={() =>
                                  handleRemoveFromGroceries(ing.name)
                                }
                              >
                                <Trash2 className="h-3 w-3" /> Remove
                              </Button>
                            )}
                            {isInCatalog && !isHidden ? (
                              <span className="inline-flex items-center text-xs px-2 py-1 rounded border border-green-300 text-green-700 bg-green-50">
                                <Check className="h-3 w-3 mr-1" /> Added
                              </span>
                            ) : !isInCatalog ? (
                              <Button
                                size="sm"
                                onClick={() =>
                                  handleAddToGroceries(ing.category, ing.name)
                                }
                                disabled={groceries.loading}
                              >
                                <Plus className="h-3 w-3 mr-1" /> Add
                              </Button>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
