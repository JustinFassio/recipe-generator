import { useState, useMemo } from 'react';
import { createDaisyUIButtonClasses } from '@/lib/button-migration';
import { createDaisyUIInputClasses } from '@/lib/input-migration';
import { createDaisyUICardClasses } from '@/lib/card-migration';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Search, ChefHat } from 'lucide-react';
import { useRecipes } from '@/hooks/use-recipes';
import { RecipeCard } from '@/components/recipes/recipe-card';
import { useNavigate } from 'react-router-dom';
import type { Recipe } from '@/lib/supabase';

export function RecipesPage() {
  const navigate = useNavigate();
  const { data: recipes = [], isLoading, error } = useRecipes();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredRecipes = useMemo(() => {
    if (!searchTerm) return recipes;

    return recipes.filter(
      (recipe) =>
        recipe.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        recipe.ingredients.some((ingredient) =>
          ingredient.toLowerCase().includes(searchTerm.toLowerCase())
        ) ||
        recipe.instructions.toLowerCase().includes(searchTerm.toLowerCase()) ||
        recipe.notes.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [recipes, searchTerm]);

  const handleEditRecipe = (recipe: Recipe) => {
    navigate('/add', { state: { recipe } });
  };

  const handleViewRecipe = (recipe: Recipe) => {
    navigate(`/recipe/${recipe.id}`);
  };

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
              <button
                className={createDaisyUIButtonClasses('default')}
                onClick={() => window.location.reload()}
              >
                Refresh Page
              </button>
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
              <h1 className="mb-2 text-3xl font-bold text-gray-900">
                My Recipes
              </h1>
              <p className="text-gray-600">
                {isLoading
                  ? 'Loading...'
                  : `${filteredRecipes.length} recipe${filteredRecipes.length !== 1 ? 's' : ''} found`}
              </p>
            </div>

            <button
              className={`${createDaisyUIButtonClasses('default')} self-start sm:self-auto`}
              onClick={() => navigate('/add')}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Recipe
            </button>
          </div>

          <div className="mt-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search recipes, ingredients, or instructions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`${createDaisyUIInputClasses('bordered')} pl-10`}
              />
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className={`${createDaisyUICardClasses('bordered')} border border-gray-200`}
              >
                <div className="aspect-video">
                  <Skeleton className="h-full w-full" />
                </div>
                <div className="card-body space-y-3">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-16 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredRecipes.length === 0 ? (
          <div className="py-20 text-center">
            <ChefHat className="mx-auto mb-4 h-16 w-16 text-gray-300" />
            {searchTerm ? (
              <>
                <h3 className="mb-2 text-lg font-semibold text-gray-600">
                  No recipes found for "{searchTerm}"
                </h3>
                <p className="mb-6 text-gray-500">
                  Try adjusting your search terms or clear the search to see all
                  recipes.
                </p>
                <button
                  className={createDaisyUIButtonClasses('outline')}
                  onClick={() => setSearchTerm('')}
                >
                  Clear Search
                </button>
              </>
            ) : (
              <>
                <h3 className="mb-2 text-lg font-semibold text-gray-600">
                  No recipes yet
                </h3>
                <p className="mb-6 text-gray-500">
                  Start building your digital cookbook by adding your first
                  recipe.
                </p>
                <button
                  className={createDaisyUIButtonClasses('default')}
                  onClick={() => navigate('/add')}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Recipe
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredRecipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                onEdit={handleEditRecipe}
                onView={handleViewRecipe}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
