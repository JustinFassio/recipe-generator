import { useState, useEffect, useCallback, useMemo } from 'react';
import { RecipeCard } from '../components/recipes/recipe-card';
import { recipeApi } from '../lib/api';
import type { PublicRecipe, RecipeFilters, Recipe } from '@/lib/types';
import { Button } from '../components/ui/button';
import { Save } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { HybridFilterBar } from '../components/recipes/hybrid-filter-bar';

export default function ExplorePage() {
  const [recipes, setRecipes] = useState<PublicRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingRecipeId, setSavingRecipeId] = useState<string | null>(null);
  const [filters, setFilters] = useState<RecipeFilters>({
    searchTerm: '',
    categories: [],
    cuisine: [],
    moods: [],
    sortBy: 'date',
    sortOrder: 'desc',
  });
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

  // Add handlers for RecipeCard functionality
  const handleViewRecipe = (recipe: Recipe) => {
    // Navigate to recipe view page
    window.open(`/recipe/${recipe.id}`, '_blank');
  };

  const handleEditRecipe = (recipe: Recipe) => {
    // For public recipes, we can't edit them directly
    // Instead, save them to user's collection first
    toast({
      title: 'Info',
      description:
        'Public recipes must be saved to your collection before editing',
    });
    handleSaveRecipe(recipe.id);
  };

  const handleShareToggle = () => {
    // For public recipes, sharing is already enabled
    toast({
      title: 'Info',
      description: 'This recipe is already public',
    });
  };

  const handleFiltersChange = (newFilters: RecipeFilters) => {
    setFilters(newFilters);
  };

  // Comprehensive filtering logic for public recipes
  const filteredRecipes = useMemo(() => {
    let filtered = [...recipes];

    // Search filter
    if (filters.searchTerm) {
      const searchTerm = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (recipe) =>
          recipe.title.toLowerCase().includes(searchTerm) ||
          recipe.instructions.toLowerCase().includes(searchTerm) ||
          recipe.ingredients.some((ingredient) =>
            ingredient.toLowerCase().includes(searchTerm)
          )
      );
    }

    // Categories filter
    if (filters.categories && filters.categories.length > 0) {
      filtered = filtered.filter(
        (recipe) =>
          recipe.categories &&
          recipe.categories.some((category) =>
            filters.categories!.includes(category)
          )
      );
    }

    // Cuisine filter
    if (filters.cuisine && filters.cuisine.length > 0) {
      filtered = filtered.filter(
        (recipe) =>
          recipe.categories &&
          recipe.categories.some((category) =>
            filters.cuisine!.some(
              (cuisine) => category === `Cuisine: ${cuisine}`
            )
          )
      );
    }

    // Moods filter
    if (filters.moods && filters.moods.length > 0) {
      filtered = filtered.filter(
        (recipe) =>
          recipe.categories &&
          recipe.categories.some((category) =>
            filters.moods!.some(
              (mood) => category === `Mood: ${mood}` || category === mood
            )
          )
      );
    }

    // Sorting
    const sorted = [...filtered].sort((a, b) => {
      let comparison = 0;

      switch (filters.sortBy) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'popularity':
          // Use updated_at as a proxy for popularity
          comparison =
            new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
          break;
        case 'date':
        default:
          comparison =
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
      }

      return filters.sortOrder === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [recipes, filters]);

  const getAuthorName = (recipe: PublicRecipe) => {
    if (recipe.author_name && recipe.author_name.trim() !== '') {
      const firstName = recipe.author_name.trim().split(' ')[0];
      return firstName || 'Anonymous';
    }
    return 'Anonymous';
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <div className="border-primary mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2"></div>
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
        <p className="text-muted-foreground mb-6">
          Discover recipes shared by our community
        </p>

        {/* Comprehensive Filter Bar */}
        <HybridFilterBar
          filters={filters}
          onFiltersChange={handleFiltersChange}
          totalRecipes={recipes.length}
          filteredCount={filteredRecipes.length}
          className="mb-6"
        />

        {/* Results Count */}
        <div className="mb-4 text-sm text-muted-foreground">
          {loading
            ? 'Loading recipes...'
            : `${filteredRecipes.length} recipe${filteredRecipes.length !== 1 ? 's' : ''} found${
                filters.searchTerm ||
                filters.categories?.length ||
                filters.cuisine?.length ||
                filters.moods?.length
                  ? ' matching your filters'
                  : ''
              }`}
        </div>
      </div>

      {filteredRecipes.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-muted-foreground">
            {filters.searchTerm ||
            filters.categories?.length ||
            filters.cuisine?.length ||
            filters.moods?.length
              ? 'No recipes found matching your filters. Try adjusting your search criteria.'
              : 'No public recipes available yet.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredRecipes.map((recipe) => (
            <div key={recipe.id} className="relative">
              <RecipeCard
                recipe={recipe}
                onView={handleViewRecipe}
                onEdit={handleEditRecipe}
                showShareButton={false}
                onShareToggle={handleShareToggle}
              />

              {/* Author info and save button */}
              <div className="mt-3 flex items-center justify-between">
                <div className="text-muted-foreground text-sm">
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
