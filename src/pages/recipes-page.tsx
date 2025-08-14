import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
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
    
    return recipes.filter(recipe =>
      recipe.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recipe.ingredients.some(ingredient => 
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
        <div className="max-w-2xl mx-auto pt-20">
          <Card className="text-center p-8">
            <CardContent>
              <ChefHat className="h-12 w-12 text-red-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
              <p className="text-gray-600 mb-4">
                We couldn't load your recipes. Please try refreshing the page.
              </p>
              <Button onClick={() => window.location.reload()}>
                Refresh Page
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-teal-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">My Recipes</h1>
              <p className="text-gray-600">
                {isLoading ? 'Loading...' : `${filteredRecipes.length} recipe${filteredRecipes.length !== 1 ? 's' : ''} found`}
              </p>
            </div>
            
            <Button onClick={() => navigate('/add')} className="self-start sm:self-auto">
              <Plus className="h-4 w-4 mr-2" />
              Add Recipe
            </Button>
          </div>

          <div className="mt-6">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
              <Input
                placeholder="Search recipes, ingredients, or instructions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i}>
                <div className="aspect-video">
                  <Skeleton className="w-full h-full" />
                </div>
                <div className="p-6 space-y-3">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-16 w-full" />
                </div>
              </Card>
            ))}
          </div>
        ) : filteredRecipes.length === 0 ? (
          <div className="text-center py-20">
            <ChefHat className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            {searchTerm ? (
              <>
                <h3 className="text-lg font-semibold text-gray-600 mb-2">
                  No recipes found for "{searchTerm}"
                </h3>
                <p className="text-gray-500 mb-6">
                  Try adjusting your search terms or clear the search to see all recipes.
                </p>
                <Button
                  variant="outline"
                  onClick={() => setSearchTerm('')}
                >
                  Clear Search
                </Button>
              </>
            ) : (
              <>
                <h3 className="text-lg font-semibold text-gray-600 mb-2">
                  No recipes yet
                </h3>
                <p className="text-gray-500 mb-6">
                  Start building your digital cookbook by adding your first recipe.
                </p>
                <Button onClick={() => navigate('/add')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Recipe
                </Button>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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