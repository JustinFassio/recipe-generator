import { useMemo, useState } from 'react';
import { useGlobalIngredients } from '@/hooks/useGlobalIngredients';
// no matcher needed here; use a simple UI normalizer aligned with matcher semantics
import { useGroceries } from '@/hooks/useGroceries';
import { useUserGroceryCart } from '@/hooks/useUserGroceryCart';
import { createDaisyUICardClasses } from '@/lib/card-migration';
import { Button } from '@/components/ui/button';
import { Search, RefreshCw } from 'lucide-react';
import {
  getCategoryMetadata,
  getAvailableCategories,
} from '@/lib/groceries/category-mapping';
import type { GlobalIngredient } from '@/lib/groceries/enhanced-ingredient-matcher';
import { IngredientCard } from '@/components/groceries/IngredientCard';

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
  const {
    loading: cartLoading,
    error: cartError,
    addToCart,
    removeFromCart,
    isInCart,
  } = useUserGroceryCart();
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

  // Get available categories from global ingredients data using consistent mapping
  const availableCategories = useMemo(() => {
    return getAvailableCategories(globalIngredients);
  }, [globalIngredients]);

  // Note: Normalization logic removed - now using multi-category-aware isInCart() function

  const handleAddToGroceries = async (category: string, name: string) => {
    await addToCart(category, name);
  };

  const handleRemoveFromGroceries = async (name: string) => {
    await removeFromCart(name);
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

        {cartError && (
          <div className="alert alert-warning mb-4">
            <span>Cart Error: {cartError}</span>
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
              {availableCategories.map((category) => {
                const categoryMeta = getCategoryMetadata(category);
                return (
                  <button
                    key={category}
                    className={`tab ${activeCategory === category ? 'tab-active' : ''}`}
                    onClick={() => setActiveCategory(category)}
                  >
                    <span className="flex items-center space-x-2">
                      <span>{categoryMeta.icon}</span>
                      <span className="hidden sm:inline">
                        {categoryMeta.name}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {loading || cartLoading ? (
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
            const categoryMeta = getCategoryMetadata(category);
            return (
              <div
                key={category}
                className={createDaisyUICardClasses('bordered mb-6')}
              >
                <div className="card-body">
                  <h2 className="card-title mb-2">
                    {categoryMeta.icon} {categoryMeta.name}
                    <span className="text-sm font-normal text-gray-500">
                      {' '}
                      ({items.length})
                    </span>
                  </h2>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                    {items.map((ing) => {
                      // Use the new multi-category-aware cart checking
                      const isInUserCart = isInCart(ing.name); // Multi-category aware check
                      const isSystemAvailable = Boolean(
                        ing.is_system &&
                          !hiddenNormalizedNames.has(ing.normalized_name)
                      ); // Available system ingredient
                      const isHidden = hiddenNormalizedNames.has(
                        ing.normalized_name
                      ); // Explicitly hidden

                      return (
                        <IngredientCard
                          key={ing.id}
                          ingredient={ing}
                          isInUserCart={isInUserCart}
                          isSystemAvailable={isSystemAvailable}
                          isHidden={isHidden}
                          onAddToGroceries={handleAddToGroceries}
                          onRemoveFromGroceries={handleRemoveFromGroceries}
                          onToggleHidden={handleToggleHidden}
                          loading={groceries.loading || false}
                          cartLoading={cartLoading || false}
                        />
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
