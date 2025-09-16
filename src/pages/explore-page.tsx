import { useState, useEffect, useCallback, useMemo } from 'react';
import { VersionedRecipeCard } from '../components/recipes/versioned-recipe-card';
import { recipeApi } from '../lib/api';
import type { PublicRecipe, Recipe } from '@/lib/types';
import { Button } from '../components/ui/button';
import { TrendingUp, Star, Eye, GitBranch } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { FilterBar } from '@/components/recipes/FilterBar';
import { useRecipeFilters } from '@/hooks/use-recipe-filters';
import { useNavigate } from 'react-router-dom';

export default function ExplorePage() {
  const [recipes, setRecipes] = useState<
    (PublicRecipe & {
      aggregate_rating?: number | null;
      total_ratings?: number;
      total_views?: number;
      total_versions?: number;
      latest_version?: number;
    })[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [savingRecipeId, setSavingRecipeId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<
    'rating' | 'views' | 'recent' | 'versions' | 'trending'
  >('rating');
  const { filters, updateFilters } = useRecipeFilters();
  const { toast } = useToast();
  const navigate = useNavigate();

  const loadPublicRecipes = useCallback(async () => {
    try {
      setLoading(true);
      let data;

      if (sortBy === 'trending') {
        data = await recipeApi.getTrendingRecipes(50); // Get more for filtering
      } else {
        data = await recipeApi.getPublicRecipesWithStats();
      }

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
  }, [toast, sortBy]);

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

  const handleRateVersion = async (
    recipeId: string,
    versionNumber: number,
    rating: number,
    comment?: string
  ) => {
    try {
      await recipeApi.rateVersion(recipeId, versionNumber, rating, comment);
      toast({
        title: 'Rating submitted',
        description: 'Thank you for rating this version!',
      });
      // Reload recipes to update stats
      await loadPublicRecipes();
    } catch (error) {
      console.error('Error rating version:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit rating',
        variant: 'destructive',
      });
    }
  };

  // Add handlers for RecipeCard functionality
  const handleViewRecipe = (recipe: Recipe | PublicRecipe) => {
    const authorName = 'author_name' in recipe ? recipe.author_name : 'Unknown';
    console.log('🔍 [Explore] View recipe clicked:', {
      recipeId: recipe.id,
      recipeTitle: recipe.title,
      isPublic: recipe.is_public,
      authorName,
      timestamp: new Date().toISOString(),
    });

    // Log current authentication state
    console.log('🔐 [Explore] Current auth state check...');

    // Log environment info
    console.log('🌍 [Explore] Environment info:', {
      isProduction: import.meta.env.PROD,
      supabaseUrl: import.meta.env.VITE_SUPABASE_URL ? 'Set' : 'Missing',
      supabaseKey: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Set' : 'Missing',
      userAgent: navigator.userAgent,
      url: window.location.href,
    });

    // Test the API call directly before navigation
    console.log('🧪 [Explore] Testing getPublicRecipe API call...');
    recipeApi
      .getPublicRecipe(recipe.id)
      .then((result) => {
        console.log('✅ [Explore] API test successful:', {
          found: !!result,
          title: result?.title,
          author: result?.author_name,
        });

        // Navigate to recipe view page in same tab with state
        console.log('🚀 [Explore] Navigating to recipe page...');
        navigate(`/recipe/${recipe.id}`, { state: { from: 'explore' } });
      })
      .catch((error) => {
        console.error('❌ [Explore] API test failed:', {
          error: error.message,
          recipeId: recipe.id,
          stack: error.stack,
        });

        toast({
          title: 'Error',
          description: `Failed to load recipe: ${error.message}`,
          variant: 'destructive',
        });
      });
  };

  // Remove handleEditRecipe - community recipes should not be editable

  const handleShareToggle = () => {
    // For public recipes, sharing is already enabled
    toast({
      title: 'Info',
      description: 'This recipe is already public',
    });
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

    // Available Ingredients filter
    if (
      filters.availableIngredients &&
      filters.availableIngredients.length > 0
    ) {
      filtered = filtered.filter((recipe) =>
        filters.availableIngredients!.some((availableIngredient) =>
          recipe.ingredients.some((recipeIngredient) =>
            recipeIngredient
              .toLowerCase()
              .includes(availableIngredient.toLowerCase())
          )
        )
      );
    }

    // Enhanced sorting with version-aware metrics
    const sorted = [...filtered].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'rating':
          // Sort by aggregate rating, then by total ratings
          const ratingA = a.aggregate_rating || a.creator_rating || 0;
          const ratingB = b.aggregate_rating || b.creator_rating || 0;
          comparison = ratingB - ratingA;
          if (comparison === 0) {
            comparison = (b.total_ratings || 0) - (a.total_ratings || 0);
          }
          break;
        case 'views':
          comparison = (b.total_views || 0) - (a.total_views || 0);
          break;
        case 'versions':
          comparison = (b.total_versions || 1) - (a.total_versions || 1);
          break;
        case 'trending':
          // Sort by trend score if available, otherwise by recent activity
          const trendA = (a as any).trend_score || 0;
          const trendB = (b as any).trend_score || 0;
          comparison = trendB - trendA;
          break;
        case 'recent':
        default:
          comparison =
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          break;
      }

      // Fallback sorting by title if primary sort is equal
      if (comparison === 0) {
        comparison = a.title.localeCompare(b.title);
      }

      return comparison;
    });

    return sorted;
  }, [recipes, filters, sortBy]);

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
        <FilterBar
          filters={filters}
          onFiltersChange={updateFilters}
          totalRecipes={recipes.length}
          filteredCount={filteredRecipes.length}
          className="mb-6"
        />

        {/* Sorting Controls */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">Sort by:</span>
            <div className="flex items-center space-x-1">
              <Button
                size="sm"
                variant={sortBy === 'rating' ? 'default' : 'outline'}
                onClick={() => setSortBy('rating')}
                className="text-xs"
              >
                <Star className="h-3 w-3 mr-1" />
                Top Rated
              </Button>
              <Button
                size="sm"
                variant={sortBy === 'views' ? 'default' : 'outline'}
                onClick={() => setSortBy('views')}
                className="text-xs"
              >
                <Eye className="h-3 w-3 mr-1" />
                Most Viewed
              </Button>
              <Button
                size="sm"
                variant={sortBy === 'versions' ? 'default' : 'outline'}
                onClick={() => setSortBy('versions')}
                className="text-xs"
              >
                <GitBranch className="h-3 w-3 mr-1" />
                Most Versions
              </Button>
              <Button
                size="sm"
                variant={sortBy === 'trending' ? 'default' : 'outline'}
                onClick={() => setSortBy('trending')}
                className="text-xs"
              >
                <TrendingUp className="h-3 w-3 mr-1" />
                Trending
              </Button>
              <Button
                size="sm"
                variant={sortBy === 'recent' ? 'default' : 'outline'}
                onClick={() => setSortBy('recent')}
                className="text-xs"
              >
                Recent
              </Button>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-4 text-sm text-muted-foreground">
          {loading
            ? 'Loading recipes...'
            : `${filteredRecipes.length} recipe${filteredRecipes.length !== 1 ? 's' : ''} found${
                filters.searchTerm ||
                filters.categories?.length ||
                filters.cuisine?.length ||
                filters.moods?.length ||
                filters.availableIngredients?.length
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
            filters.moods?.length ||
            filters.availableIngredients?.length
              ? 'No recipes found matching your filters. Try adjusting your search criteria.'
              : 'No public recipes available yet.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredRecipes.map((recipe) => (
            <VersionedRecipeCard
              key={recipe.id}
              recipe={recipe}
              onView={handleViewRecipe}
              onSave={handleSaveRecipe}
              onRateVersion={handleRateVersion}
              savingRecipeId={savingRecipeId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
