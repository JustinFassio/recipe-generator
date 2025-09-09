import { useState, useMemo, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthProvider';
import { useGroceries } from '@/hooks/useGroceries';
import { Button } from '@/components/ui/button';
import { GROCERY_CATEGORIES } from '@/lib/groceries/categories';
import { createDaisyUICardClasses } from '@/lib/card-migration';
import { IngredientMatchingTest } from '@/components/groceries/ingredient-matching-test';
import { Save, RefreshCw, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useGlobalIngredients } from '@/hooks/useGlobalIngredients';
import { supabase } from '@/lib/supabase';

export function GroceriesPage() {
  const { user } = useAuth();
  const groceries = useGroceries();
  const { hiddenNormalizedNames, globalIngredients } = useGlobalIngredients();
  const [activeCategory, setActiveCategory] = useState<string>('');

  // State for user's grocery cart (from user_groceries table)
  const [userGroceryCart, setUserGroceryCart] = useState<
    Record<string, string[]>
  >({});

  // Load user's grocery cart from user_groceries table
  const loadUserGroceryCart = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('user_groceries')
        .select('groceries')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows returned
        console.error('Error loading grocery cart:', error);
        return;
      }

      setUserGroceryCart(data?.groceries || {});
    } catch (error) {
      console.error('Error loading grocery cart:', error);
    }
  }, [user?.id]);

  // Load grocery cart when user changes
  useEffect(() => {
    loadUserGroceryCart();
  }, [loadUserGroceryCart]);

  // Get available categories from global ingredients data (source of truth)
  const availableCategories = useMemo(() => {
    const categories = [...new Set(globalIngredients.map((g) => g.category))];
    return categories.sort();
  }, [globalIngredients]);

  // Set default active category to first available category
  useEffect(() => {
    if (availableCategories.length > 0 && !activeCategory) {
      setActiveCategory(availableCategories[0]);
    }
  }, [availableCategories, activeCategory]);

  // Get category count from grocery cart
  const getCategoryCount = (category: string) => {
    return userGroceryCart[category]?.length || 0;
  };

  const handleSave = async () => {
    await groceries.saveGroceries();
  };

  const handleRefresh = async () => {
    await loadUserGroceryCart();
    await groceries.loadGroceries();
  };

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

  const activeCategoryData = GROCERY_CATEGORIES[
    activeCategory as keyof typeof GROCERY_CATEGORIES
  ] || {
    name: activeCategory,
    icon: '📦',
  };

  // Show ALL ingredients that user has added to their grocery cart (both selected and unselected)
  const userCategoryItems = (() => {
    // Get ingredients from the user's grocery cart (user_groceries table)
    const cartIngredients = userGroceryCart[activeCategory] || [];

    // Filter out any system-hidden items
    const filterHidden = (name: string) => {
      // best-effort normalize similar to matcher (lightweight)
      const normalized = name
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      return !hiddenNormalizedNames.has(normalized);
    };

    return cartIngredients
      .filter(filterHidden)
      .sort((a, b) => a.localeCompare(b));
  })();

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-teal-50">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Groceries</h1>
              <p className="text-gray-600">
                Manage your personal ingredient collection. Mark items as
                available (have it) or unavailable (need to buy).
              </p>
              {groceries.selectedCount > 0 && (
                <p className="text-sm text-green-600 font-medium">
                  {groceries.selectedCount} ingredient
                  {groceries.selectedCount !== 1 ? 's' : ''} available in your
                  kitchen
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
              <Button
                onClick={handleSave}
                disabled={groceries.loading}
                className="bg-orange-500 hover:bg-orange-600"
              >
                <Save className="mr-2 h-4 w-4" />
                Save
                {groceries.selectedCount > 0 && ` (${groceries.selectedCount})`}
              </Button>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {groceries.error && (
          <div className="alert alert-error mb-6">
            <span>{groceries.error}</span>
          </div>
        )}

        {/* Category Tabs */}
        <div className={createDaisyUICardClasses('bordered mb-6')}>
          <div className="card-body p-0">
            <div className="tabs tabs-boxed p-4 overflow-x-auto">
              {availableCategories.map((categoryKey) => {
                const category =
                  GROCERY_CATEGORIES[
                    categoryKey as keyof typeof GROCERY_CATEGORIES
                  ];
                const count = getCategoryCount(categoryKey);
                return (
                  <button
                    key={categoryKey}
                    className={`tab ${activeCategory === categoryKey ? 'tab-active' : ''}`}
                    onClick={() => setActiveCategory(categoryKey)}
                  >
                    <span className="flex items-center space-x-2">
                      <span>{category?.icon || '📦'}</span>
                      <span className="hidden sm:inline">
                        {category?.name || categoryKey}
                      </span>
                      <span className="sm:hidden">
                        {category?.name?.split(' ')[0] || categoryKey}
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

        {/* Ingredient Grid */}
        <div className={createDaisyUICardClasses('bordered')}>
          <div className="card-body">
            <h2 className="card-title mb-4">
              {activeCategoryData.icon} {activeCategoryData.name}
            </h2>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {userCategoryItems.map((ingredient) => {
                const isSelected = groceries.hasIngredient(
                  activeCategory,
                  ingredient
                );
                return (
                  <button
                    key={ingredient}
                    onClick={() =>
                      groceries.toggleIngredient(activeCategory, ingredient)
                    }
                    disabled={groceries.loading}
                    className={`btn btn-sm transition-all duration-200 ${
                      isSelected
                        ? 'btn-primary'
                        : 'btn-outline btn-ghost hover:btn-outline'
                    } ${groceries.loading ? 'btn-disabled' : ''}`}
                    title={
                      isSelected
                        ? 'Available - you have this'
                        : 'Unavailable - you need to buy this'
                    }
                  >
                    {ingredient}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Selected Ingredients Summary */}
        {groceries.selectedCount > 0 && (
          <div
            className={createDaisyUICardClasses('bordered mt-6 bg-base-200')}
          >
            <div className="card-body">
              <div className="flex items-center justify-between mb-4">
                <h3 className="card-title text-lg">
                  Available in Your Kitchen ({groceries.selectedCount})
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={groceries.clearAll}
                  disabled={groceries.loading}
                  className="text-red-600 hover:text-red-700"
                >
                  Clear All
                </Button>
              </div>

              <div className="space-y-3">
                {Object.entries(groceries.groceries).map(
                  ([category, ingredients]) => (
                    <div key={category}>
                      <h4 className="text-sm font-medium text-gray-600 mb-2 capitalize">
                        {category} ({ingredients.length})
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {ingredients.map((ingredient) => (
                          <span
                            key={`${category}-${ingredient}`}
                            className="badge badge-primary gap-2 cursor-pointer hover:badge-primary-focus"
                            onClick={() =>
                              groceries.toggleIngredient(category, ingredient)
                            }
                          >
                            {ingredient}
                            <span className="text-xs">×</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        )}

        {/* Ingredient Matching Test Section */}
        {groceries.selectedCount > 0 && (
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
