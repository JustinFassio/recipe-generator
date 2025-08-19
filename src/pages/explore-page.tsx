import { useState, useEffect, useCallback } from 'react';
import { RecipeCard } from '../components/recipes/recipe-card';
import { recipeApi } from '../lib/api';
import type { PublicRecipe } from '../lib/supabase';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Search, Save } from 'lucide-react';
import { useToast } from '../hooks/use-toast';

export default function ExplorePage() {
  const [recipes, setRecipes] = useState<PublicRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [savingRecipeId, setSavingRecipeId] = useState<string | null>(null);
  const { toast } = useToast();

  const loadPublicRecipes = useCallback(async () => {
    try {
      setLoading(true);
      const data = await recipeApi.getPublicRecipes();
      setRecipes(data);
    } catch (error) {
      console.error('Error loading public recipes:', error);
      toast({
        title: 'Error',
        description: 'Failed to load public recipes',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadPublicRecipes();
  }, [loadPublicRecipes]);

  const handleSaveRecipe = async (recipeId: string) => {
    try {
      setSavingRecipeId(recipeId);
      await recipeApi.savePublicRecipe(recipeId);
      toast({
        title: 'Success',
        description: 'Recipe saved to your collection!',
      });
    } catch (error) {
      console.error('Error saving recipe:', error);
      toast({
        title: 'Error',
        description: 'Failed to save recipe',
        variant: 'destructive',
      });
    } finally {
      setSavingRecipeId(null);
    }
  };

  const filteredRecipes = recipes.filter((recipe) =>
    recipe.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getAuthorName = (recipe: PublicRecipe) => {
    if (recipe.author_name) {
      return recipe.author_name.split(' ')[0]; // First name only
    }
    return 'Anonymous';
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
            <p className="text-muted-foreground">Loading public recipes...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">Explore Recipes</h1>
        <p className="mb-6 text-muted-foreground">
          Discover recipes shared by our community
        </p>

        {/* Search */}
        <div className="relative mb-6 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search recipes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {filteredRecipes.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-muted-foreground">
            {searchTerm
              ? 'No recipes found matching your search.'
              : 'No public recipes available yet.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredRecipes.map((recipe) => (
            <div key={recipe.id} className="relative">
              <RecipeCard recipe={recipe} />

              {/* Author info and save button */}
              <div className="mt-3 flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  by {getAuthorName(recipe)}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleSaveRecipe(recipe.id)}
                  disabled={savingRecipeId === recipe.id}
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {savingRecipeId === recipe.id ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
