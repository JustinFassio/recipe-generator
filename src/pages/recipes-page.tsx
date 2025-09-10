import { createDaisyUICardClasses } from '@/lib/card-migration';
import { createDaisyUISkeletonClasses } from '@/lib/skeleton-migration';
import { Plus, ChefHat, Sparkles } from 'lucide-react';
import { useRecipes } from '@/hooks/use-recipes';
import { useRecipeFilters } from '@/hooks/use-recipe-filters';
import { RecipeCard } from '@/components/recipes/recipe-card';
import { FilterBar } from '@/components/recipes/FilterBar';
import { Button } from '@/components/ui/button';
import { FloatingActionButton } from '@/components/ui/fab';
import { useNavigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import type { Recipe } from '@/lib/types';

export function RecipesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { filters, updateFilters } = useRecipeFilters();
  const { data: recipes = [], isLoading, error } = useRecipes(filters);

  // Force-refresh recipes when navigated to with a refresh flag
  useEffect(() => {
    const state = location.state as { refresh?: number } | null;
    if (state?.refresh) {
      queryClient.invalidateQueries({ queryKey: ['recipes'], exact: false });
    }
  }, [location.state, queryClient]);

  const handleEditRecipe = useCallback(
    (recipe: Recipe) => {
      navigate('/add', { state: { recipe } });
    },
    [navigate]
  );

  const handleViewRecipe = useCallback(
    (recipe: Recipe) => {
      navigate(`/recipe/${recipe.id}`);
    },
    [navigate]
  );

  const handleShareToggle = useCallback(() => {
    // The RecipeCard component handles the API call internally
    // This callback can be used for additional UI updates if needed
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-teal-50 p-4">
        <div className="mx-auto max-w-2xl pt-20">
          <div
            className={`${createDaisyUICardClasses('bordered')} border border-gray-200 p-8 text-center`}
          >
            <div className="card-body">
              <ChefHat className="mx-auto mb-4 h-12 w-12 text-red-400" />
              <h2 className="mb-2 text-xl font-semibold">
                Something went wrong
              </h2>
              <p className="mb-4 text-gray-600">
                We couldn't load your recipes. Please try refreshing the page.
              </p>
              <Button onClick={() => window.location.reload()}>
                Refresh Page
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-teal-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="mb-2 inline-block rounded-lg px-4 py-2 text-xl font-bold text-neutral-600">
                My Recipes
              </h1>
              <p className="text-sm text-neutral-500">
                {isLoading
                  ? 'Loading...'
                  : `${recipes.length} recipe${recipes.length !== 1 ? 's' : ''} found`}
              </p>
            </div>

            <div className="flex flex-col gap-2 self-start sm:flex-row sm:self-auto">
              <Button
                variant={
                  location.pathname === '/chat-recipe' ? 'default' : 'ghost'
                }
                onClick={() => navigate('/chat-recipe')}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                AI Recipe Creator
              </Button>
              <Button
                onClick={() => navigate('/add')}
                className="bg-success text-success-content hover:bg-success/80"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Recipe
              </Button>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <FilterBar
          filters={filters}
          onFiltersChange={updateFilters}
          totalRecipes={recipes.length}
          filteredCount={recipes.length}
          className="mb-6"
        />

        {/* Recipe Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className={`${createDaisyUICardClasses('bordered')} h-64 animate-pulse`}
              >
                <div className="card-body">
                  <div
                    className={`${createDaisyUISkeletonClasses()} h-4 w-3/4`}
                  />
                  <div
                    className={`${createDaisyUISkeletonClasses()} h-3 w-1/2`}
                  />
                  <div
                    className={`${createDaisyUISkeletonClasses()} h-3 w-2/3`}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : recipes.length === 0 ? (
          <div className="py-12 text-center">
            <div
              className={`${createDaisyUICardClasses('bordered')} mx-auto max-w-md`}
            >
              <div className="card-body">
                <ChefHat className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                <h3 className="mb-2 text-lg font-semibold">No recipes found</h3>
                <p className="mb-4 text-gray-600">
                  {filters.searchTerm ||
                  filters.categories?.length ||
                  filters.cuisine?.length ||
                  filters.moods?.length
                    ? 'Try adjusting your filters or search terms.'
                    : 'Start by adding your first recipe!'}
                </p>
                {!filters.searchTerm &&
                  !filters.categories?.length &&
                  !filters.cuisine?.length &&
                  !filters.moods?.length && (
                    <Button
                      onClick={() => navigate('/add')}
                      className="bg-success text-success-content hover:bg-success/80"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Your First Recipe
                    </Button>
                  )}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {recipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                onEdit={handleEditRecipe}
                onView={handleViewRecipe}
                showShareButton={true}
                onShareToggle={handleShareToggle}
              />
            ))}
          </div>
        )}

        {/* Floating Action Button */}
        <FloatingActionButton
          icon={<Plus className="h-6 w-6" />}
          items={[
            {
              id: 'ai-create',
              icon: <Sparkles className="h-4 w-4" />,
              label: 'AI Recipe Creator',
              onClick: () => navigate('/chat-recipe'),
            },
            {
              id: 'add-recipe',
              icon: <Plus className="h-4 w-4" />,
              label: 'Add Recipe',
              onClick: () => navigate('/add'),
            },
          ]}
        />
      </div>
    </div>
  );
}
