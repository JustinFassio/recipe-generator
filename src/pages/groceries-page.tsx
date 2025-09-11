import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthProvider';
import { useGroceries } from '@/hooks/useGroceries';
import { useUserGroceryCart } from '@/hooks/useUserGroceryCart';
import { Button } from '@/components/ui/button';
import {
  getCategoryMetadata,
  getAvailableCategories,
} from '@/lib/groceries/category-mapping';
import { createDaisyUICardClasses } from '@/lib/card-migration';
import { IngredientMatchingTest } from '@/components/groceries/ingredient-matching-test';
import { Save, RefreshCw, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useGlobalIngredients } from '@/hooks/useGlobalIngredients';

export function GroceriesPage() {
  const { user } = useAuth();
  const groceries = useGroceries();
  const { hiddenNormalizedNames, globalIngredients } = useGlobalIngredients();
  const {
    userGroceryCart,
    loading: cartLoading,
    error: cartError,
    refreshCart,
  } = useUserGroceryCart();
  const [activeCategory, setActiveCategory] = useState<string>('');

  // Get available categories from global ingredients data using consistent mapping
  const availableCategories = useMemo(() => {
    return ['all', ...getAvailableCategories(globalIngredients)];
  }, [globalIngredients]);

  // Set default active category to 'all'
  useEffect(() => {
    if (availableCategories.length > 0 && !activeCategory) {
      setActiveCategory('all');
    }
  }, [availableCategories, activeCategory]);

  // Get category count from grocery cart
  const getCategoryCount = (category: string) => {
    if (category === 'all') {
      return Object.values(userGroceryCart).reduce(
        (total, items) => total + (items?.length || 0),
        0
      );
    }
    return userGroceryCart[category]?.length || 0;
  };

  const handleSave = async () => {
    await groceries.saveGroceries();
  };

  const handleRefresh = async () => {
    await refreshCart();
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

  const activeCategoryData =
    activeCategory === 'all'
      ? { name: 'All Categories', subtitle: 'All Your Ingredients', icon: '📋' }
      : getCategoryMetadata(activeCategory);

  // Show ALL ingredients that user has added to their grocery cart (both selected and unselected)
  const userCategoryItems = (() => {
    let cartIngredients: string[] = [];

    if (activeCategory === 'all') {
      // For 'all' view, get ingredients from all categories
      cartIngredients = Object.values(userGroceryCart).flat();
    } else {
      // For specific category, get ingredients from that category
      cartIngredients = userGroceryCart[activeCategory] || [];
    }

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
                disabled={groceries.loading || cartLoading}
              >
                <RefreshCw
                  className={`mr-2 h-4 w-4 ${groceries.loading ? 'animate-spin' : ''}`}
                />
                Refresh
              </Button>
              <Button
                onClick={handleSave}
                disabled={groceries.loading || cartLoading}
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

        {/* Ingredient Grid */}
        <div className={createDaisyUICardClasses('bordered')}>
          <div className="card-body">
            <h2 className="card-title mb-4">
              {activeCategoryData.icon} {activeCategoryData.name}
            </h2>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {userCategoryItems.map((ingredient) => {
                // For "all" view, we need to find which category this ingredient belongs to
                const ingredientCategory =
                  activeCategory === 'all'
                    ? Object.keys(userGroceryCart).find((cat) =>
                        userGroceryCart[cat]?.includes(ingredient)
                      ) || activeCategory
                    : activeCategory;

                const isSelected = groceries.hasIngredient(
                  ingredientCategory,
                  ingredient
                );

                return (
                  <button
                    key={ingredient}
                    onClick={() =>
                      groceries.toggleIngredient(ingredientCategory, ingredient)
                    }
                    disabled={groceries.loading || cartLoading}
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

        {/* Cart Error Display */}
        {cartError && (
          <div className="alert alert-warning mb-4">
            <span>Cart Error: {cartError}</span>
          </div>
        )}

        {/* Selected Ingredients Summary */}

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
