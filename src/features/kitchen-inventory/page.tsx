import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthProvider';
import { useGroceriesQuery } from '@/hooks/useGroceriesQuery';
import { Button } from '@/components/ui/button';
import {
  getCategoryMetadata,
  getAvailableCategories,
} from '@/lib/groceries/category-mapping';
import { createDaisyUICardClasses } from '@/lib/card-migration';
import { IngredientMatchingTest } from '@/components/groceries/ingredient-matching-test';
import { GroceryCard } from '@/components/groceries/GroceryCard';
import { RefreshCw, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useGlobalIngredients } from '@/hooks/useGlobalIngredients';
import { getCategories } from '@/lib/ingredients/repository';
import { resolveCategoryForIngredient } from './utils/resolve-category';

export function KitchenInventoryPage() {
  const { user } = useAuth();
  const groceries = useGroceriesQuery();
  const { hiddenNormalizedNames, globalIngredients } = useGlobalIngredients();
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [normalizedCategories, setNormalizedCategories] = useState<string[]>(
    []
  );

  const availableCategories = useMemo(() => {
    // Prefer normalized categories if present; fallback to legacy mapping
    const slugs =
      normalizedCategories.length > 0
        ? normalizedCategories
        : getAvailableCategories(globalIngredients);
    return ['all', ...slugs];
  }, [normalizedCategories, globalIngredients]);

  useEffect(() => {
    if (availableCategories.length > 0 && !activeCategory) {
      setActiveCategory('all');
    }
  }, [availableCategories, activeCategory]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const cats = await getCategories();
        if (!mounted) return;
        setNormalizedCategories(cats.map((c) => c.slug));
      } catch {
        // swallow; fallback will be used
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const getCategoryCount = (category: string) => {
    return groceries.getCategoryCount(category);
  };

  const handleRefresh = async () => {
    groceries.refetch();
  };

  const ingredientToCategoryMap = useMemo(() => {
    const map = new Map<string, string>();
    Object.entries(groceries.groceries).forEach(([category, ingredients]) => {
      if (Array.isArray(ingredients)) {
        ingredients.forEach((ingredient) => {
          map.set(ingredient, category);
        });
      }
    });
    return map;
  }, [groceries.groceries]);

  const userCategoryItems = useMemo(() => {
    // Only show available ingredients (in kitchen inventory)
    // Unavailable ingredients should only appear on shopping list page
    let allIngredients: string[] = [];

    if (activeCategory === 'all') {
      // Get only available ingredients from groceries
      allIngredients = Object.values(groceries.groceries).flat() as string[];
    } else {
      // Get only available ingredients from specific category
      allIngredients =
        (groceries.groceries as Record<string, string[]>)[activeCategory] || [];
    }

    // Debug logging
    if (import.meta.env.DEV) {
      console.log('KitchenInventoryPage userCategoryItems:', {
        activeCategory,
        groceries: groceries.groceries,
        shoppingList: groceries.shoppingList,
        availableIngredients: allIngredients,
        availableCount: allIngredients.length,
        unavailableCount: Object.keys(groceries.shoppingList).length,
      });
    }

    const filterHidden = (name: string) => {
      const normalized = name
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      return !hiddenNormalizedNames.has(normalized);
    };

    return allIngredients
      .filter(filterHidden)
      .sort((a, b) => a.localeCompare(b));
  }, [
    activeCategory,
    groceries.groceries,
    groceries.shoppingList,
    hiddenNormalizedNames,
  ]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-teal-50">
        <div className="mx-auto max-w-4xl px-4 py-8">
          <div className={createDaisyUICardClasses('bordered')}>
            <div className="card-body text-center">
              <h2 className="card-title justify-center">
                Authentication Required
              </h2>
              <p>Please sign in to manage your groceries.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const activeCategoryData =
    activeCategory === 'all'
      ? { name: 'All Categories', subtitle: 'All Your Ingredients', icon: '📋' }
      : getCategoryMetadata(activeCategory);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-teal-50">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Kitchen</h1>
              <p className="text-gray-600">
                Manage your kitchen inventory. Mark items as available (in
                stock) or unavailable (need to buy). Unavailable items are added
                to your shopping list.
              </p>
              {groceries.getTotalCount() > 0 && (
                <p className="text-sm text-green-600 font-medium">
                  {groceries.getTotalCount()} ingredient
                  {groceries.getTotalCount() !== 1 ? 's' : ''} available in your
                  kitchen
                </p>
              )}
              {groceries.getShoppingListCount() > 0 && (
                <p className="text-sm text-orange-600 font-medium">
                  {groceries.getShoppingListCount()} item
                  {groceries.getShoppingListCount() !== 1 ? 's' : ''} in
                  shopping list
                </p>
              )}
            </div>
            <div className="flex space-x-2">
              <Link to="/global-ingredients" className="btn btn-outline">
                <Globe className="mr-2 h-4 w-4" /> Global Ingredients
              </Link>
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={groceries.loading}
              >
                <RefreshCw
                  className={`mr-2 h-4 w-4 ${groceries.loading ? 'animate-spin' : ''}`}
                />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {groceries.error && (
          <div className="alert alert-error mb-6">
            <span>{groceries.error}</span>
          </div>
        )}

        <div className={createDaisyUICardClasses('bordered mb-6')}>
          <div className="card-body p-0">
            <div className="tabs tabs-boxed p-4 overflow-x-auto">
              {availableCategories.map((categoryKey) => {
                const category =
                  categoryKey === 'all'
                    ? { name: 'All Categories', icon: '📋' }
                    : getCategoryMetadata(categoryKey);
                const count = getCategoryCount(categoryKey);
                return (
                  <button
                    key={categoryKey}
                    className={`tab ${activeCategory === categoryKey ? 'tab-active' : ''}`}
                    onClick={() => setActiveCategory(categoryKey)}
                  >
                    <span className="flex items-center space-x-2">
                      <span>{category.icon}</span>
                      <span className="hidden sm:inline">{category.name}</span>
                      <span className="sm:hidden">
                        {categoryKey === 'all'
                          ? 'All'
                          : category.name.split(' ')[0]}
                      </span>
                      {count > 0 && (
                        <span className="badge badge-sm badge-primary">
                          {count}
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className={createDaisyUICardClasses('bordered')}>
          <div className="card-body">
            <h2 className="card-title mb-4">
              {activeCategoryData.icon} {activeCategoryData.name}
            </h2>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {userCategoryItems.map((ingredient) => {
                const ingredientCategory = resolveCategoryForIngredient(
                  ingredient,
                  activeCategory,
                  groceries.groceries,
                  ingredientToCategoryMap
                );
                if (!ingredientCategory) return null;
                const isAvailable = groceries.hasIngredient(
                  ingredientCategory,
                  ingredient
                );

                return (
                  <GroceryCard
                    key={ingredient}
                    ingredient={ingredient}
                    category={ingredientCategory}
                    loading={groceries.loading}
                    isSelected={isAvailable}
                    onToggle={groceries.toggleIngredient}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {groceries.error && (
          <div className="alert alert-warning mb-4">
            <span>Groceries Error: {groceries.error}</span>
          </div>
        )}

        {groceries.getTotalCount() > 0 && (
          <div className={createDaisyUICardClasses('bordered mt-6')}>
            <div className="card-body">
              <h3 className="card-title text-lg mb-4">
                🧪 Ingredient Matching Test
              </h3>
              <IngredientMatchingTest />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
