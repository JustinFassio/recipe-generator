import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useRecipe, usePublicRecipe } from '@/hooks/use-recipes';
import { useState, useEffect } from 'react';
import { RecipeView } from '@/components/recipes/recipe-view';
import { VersionSelector } from '@/components/recipes/version-selector';
import { CreateVersionModal } from '@/components/recipes/create-version-modal';
import { createDaisyUICardClasses } from '@/lib/card-migration';
import { createDaisyUISkeletonClasses } from '@/lib/skeleton-migration';
import { ChefHat, GitBranch, ArrowLeft } from 'lucide-react';
import { RecipeDiagnostic } from '@/components/debug/RecipeDiagnostic';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthProvider';
import { recipeApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import type { RecipeVersion, VersionStats, AggregateStats } from '@/lib/types';

export function RecipeViewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  // Debug logging
  console.log('🔍 [RecipeViewPage] Component initialized:', {
    recipeId: id,
    timestamp: new Date().toISOString(),
    url: window.location.href,
    isProduction: import.meta.env.PROD,
    hasUser: !!user,
    authLoading,
  });

  // Optimize: Try public recipe first for better performance on public recipe pages
  const {
    data: publicRecipe,
    isLoading: publicLoading,
    error: publicError,
  } = usePublicRecipe(id!);

  // Always try to fetch user recipe if we have an authenticated user
  // This ensures we can find both public and private recipes owned by the user
  const shouldFetchUser = !!user && !authLoading;
  const {
    data: userRecipe,
    isLoading: userLoading,
    error: userError,
  } = useRecipe(shouldFetchUser ? id! : '');

  // Use whichever one succeeds
  const recipe = userRecipe || publicRecipe;
  // isLoading is true only if at least one query is loading and no data has been found yet
  const isLoading = (userLoading || publicLoading) && !recipe;
  // error if both queries have failed or neither query has returned data
  const error =
    !userLoading && !publicLoading && !recipe
      ? userError || publicError || new Error('Recipe not found')
      : null;

  // Community rating state
  const [communityRating, setCommunityRating] = useState<{
    average: number;
    count: number;
    userRating?: number;
  } | null>(null);
  const [ratingLoading, setRatingLoading] = useState(false);

  // Version navigation state
  const [showVersions, setShowVersions] = useState(false);
  const [versions, setVersions] = useState<RecipeVersion[]>([]);
  const [currentVersionNumber, setCurrentVersionNumber] = useState<number>(1);
  const [aggregateStats, setAggregateStats] = useState<AggregateStats | null>(
    null
  );
  const [isOwner, setIsOwner] = useState(false);
  const [showCreateVersion, setShowCreateVersion] = useState(false);

  // Enhanced debugging
  console.log('📊 [RecipeViewPage] State summary:', {
    recipeId: id,
    userRecipe: userRecipe ? 'Found' : 'Not found',
    publicRecipe: publicRecipe ? 'Found' : 'Not found',
    finalRecipe: recipe ? 'Found' : 'Not found',
    userLoading,
    publicLoading,
    isLoading,
    userError: userError?.message,
    publicError: publicError?.message,
    finalError: error?.message,
    shouldFetchUser,
    hasUser: !!user,
    authLoading,
  });

  // Load version data when recipe is loaded
  useEffect(() => {
    if (recipe) {
      loadVersionData(recipe);
      checkOwnership(recipe);
      setCurrentVersionNumber(recipe.version_number || 1);
    }
  }, [recipe, user]);

  // Fetch community rating when recipe is loaded and it's a public recipe
  useEffect(() => {
    if (recipe && publicRecipe) {
      setRatingLoading(true);
      recipeApi
        .getCommunityRating(recipe.id)
        .then(setCommunityRating)
        .catch((error) => {
          console.error('Failed to fetch community rating:', error);
          setCommunityRating(null);
        })
        .finally(() => setRatingLoading(false));
    }
  }, [recipe, publicRecipe]);

  const loadVersionData = async (currentRecipe: any) => {
    try {
      const originalRecipeId =
        currentRecipe.parent_recipe_id || currentRecipe.id;

      // Load versions
      const versionsData = await recipeApi.getRecipeVersions(originalRecipeId);
      setVersions(versionsData);

      // Load aggregate stats
      const aggregateData = await recipeApi.getAggregateStats(originalRecipeId);
      setAggregateStats(aggregateData);

      // Track view for current version
      if (publicRecipe) {
        await recipeApi.trackVersionView(
          currentRecipe.id,
          currentRecipe.version_number || 1
        );
      }
    } catch (error) {
      console.error('Failed to load version data:', error);
    }
  };

  const checkOwnership = async (currentRecipe: any) => {
    if (user) {
      const originalRecipeId =
        currentRecipe.parent_recipe_id || currentRecipe.id;
      const owns = await recipeApi.checkRecipeOwnership(originalRecipeId);
      setIsOwner(owns);
    }
  };

  // Handle community rating submission
  const handleCommunityRating = async (rating: number) => {
    if (!recipe) return;

    try {
      await recipeApi.submitCommunityRating(recipe.id, rating);
      toast({
        title: 'Rating submitted',
        description: 'Thank you for rating this recipe!',
      });

      // Refresh community rating data
      const updatedRating = await recipeApi.getCommunityRating(recipe.id);
      setCommunityRating(updatedRating);
    } catch (error) {
      console.error('Error submitting rating:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit rating. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Handle version selection
  const handleVersionSelect = (version: RecipeVersion) => {
    if (version.recipe) {
      // Navigate to the selected version
      navigate(`/recipe/${version.recipe.id}`, {
        state: { from: 'version-navigation' },
        replace: true,
      });
    }
  };

  // Handle version rating
  const handleVersionRating = async (
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

      // Reload version data to update stats
      if (recipe) {
        await loadVersionData(recipe);
      }
    } catch (error) {
      console.error('Error rating version:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit rating',
        variant: 'destructive',
      });
    }
  };

  // Handle version creation
  const handleVersionCreated = (newVersion: Recipe) => {
    // Navigate to the new version
    navigate(`/recipe/${newVersion.id}`, {
      state: { from: 'version-creation' },
      replace: true,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-teal-50">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="space-y-6">
            <div className={createDaisyUISkeletonClasses('h-10 w-48')} />
            <div className={createDaisyUICardClasses('bordered')}>
              <div className="card-body p-6">
                <div
                  className={createDaisyUISkeletonClasses('mb-4 h-64 w-full')}
                />
                <div
                  className={createDaisyUISkeletonClasses('mb-2 h-8 w-3/4')}
                />
                <div className={createDaisyUISkeletonClasses('h-4 w-1/2')} />
              </div>
            </div>
            <div className={createDaisyUICardClasses('bordered')}>
              <div className="card-body space-y-4 p-6">
                <div className={createDaisyUISkeletonClasses('h-6 w-32')} />
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className={createDaisyUISkeletonClasses('h-4 w-full')}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !recipe) {
    console.error('❌ [RecipeViewPage] Error state reached:', {
      recipeId: id,
      error: error?.message,
      userError: userError?.message,
      publicError: publicError?.message,
      hasRecipe: !!recipe,
      stack: error?.stack,
    });

    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-teal-50 p-4">
        <div className="mx-auto max-w-2xl pt-20">
          <div
            className={`${createDaisyUICardClasses('bordered')} p-8 text-center`}
          >
            <div className="card-body">
              <ChefHat className="mx-auto mb-4 h-12 w-12 text-red-400" />
              <h2 className="mb-2 text-xl font-semibold">Recipe not found</h2>
              <p className="mb-4 text-gray-600">
                The recipe you're looking for doesn't exist or has been deleted.
              </p>

              {/* Debug info for production troubleshooting */}
              {import.meta.env.PROD && (
                <div className="mb-4 rounded-lg bg-gray-100 p-3 text-left text-sm">
                  <p className="font-medium text-gray-800">Debug Info:</p>
                  <p className="text-gray-600">Recipe ID: {id}</p>
                  <p className="text-gray-600">
                    Error: {error?.message || 'No error message'}
                  </p>
                  <p className="text-gray-600">
                    User Error: {userError?.message || 'None'}
                  </p>
                  <p className="text-gray-600">
                    Public Error: {publicError?.message || 'None'}
                  </p>
                  <p className="text-gray-600">
                    Has Recipe: {recipe ? 'Yes' : 'No'}
                  </p>
                </div>
              )}

              {/* Recipe Diagnostic Tool */}
              <div className="mb-4">
                <RecipeDiagnostic recipeId={id} />
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
                <Button onClick={() => navigate('/')} variant="outline">
                  Back to Home
                </Button>
                <Button onClick={() => navigate('/explore')} variant="outline">
                  Browse Public Recipes
                </Button>
                <Button
                  onClick={() => window.location.reload()}
                  variant="outline"
                >
                  Retry
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Determine where we came from for better navigation
  const cameFromExplore =
    location.state?.from === 'explore' ||
    document.referrer.includes('/explore');

  // Determine if this should show Save or Edit button
  // Show Save if:
  // 1. We found a public recipe (regardless of who owns it), AND
  // 2. We came from the explore page
  // Show Edit if:
  // 1. We found a user recipe (private recipe), OR
  // 2. We didn't come from explore page
  const shouldShowSave = !!publicRecipe && cameFromExplore;
  const shouldShowEdit = !shouldShowSave;

  const handleEdit = () => {
    navigate('/add', { state: { recipe } });
  };

  const handleSave = async () => {
    if (!recipe) return;

    try {
      await recipeApi.savePublicRecipe(recipe.id);
      toast({
        title: 'Success',
        description: 'Recipe saved to your collection!',
      });

      // Navigate to user's recipes page to show the saved recipe
      navigate('/recipes', { state: { refresh: Date.now() } });
    } catch (error) {
      console.error('Error saving recipe:', error);
      toast({
        title: 'Error',
        description: 'Failed to save recipe',
        variant: 'destructive',
      });
    }
  };

  const handleBack = () => {
    // If we came from explore page, go back there, otherwise go to recipes
    if (cameFromExplore) {
      navigate('/explore');
    } else {
      navigate('/recipes');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-teal-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Version Navigation Header */}
        {versions.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBack}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>

                {aggregateStats && (
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-xs">
                      <GitBranch className="h-3 w-3 mr-1" />
                      {aggregateStats.total_versions} version
                      {aggregateStats.total_versions !== 1 ? 's' : ''}
                    </Badge>
                    {aggregateStats.aggregate_avg_rating && (
                      <Badge variant="secondary" className="text-xs">
                        ⭐ {aggregateStats.aggregate_avg_rating.toFixed(1)} (
                        {aggregateStats.total_ratings} ratings)
                      </Badge>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2">
                {versions.length > 1 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowVersions(!showVersions)}
                  >
                    <GitBranch className="h-4 w-4 mr-2" />
                    {showVersions ? 'Hide' : 'View'} Versions
                  </Button>
                )}
              </div>
            </div>

            {/* Current Version Info */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="default">
                      Version {currentVersionNumber}
                      {currentVersionNumber ===
                        aggregateStats?.latest_version && ' (Latest)'}
                    </Badge>
                    {recipe && (
                      <span className="text-sm font-medium text-gray-900">
                        {recipe.title}
                      </span>
                    )}
                  </div>
                  {recipe?.creator_rating && (
                    <div className="flex items-center space-x-1 mt-1">
                      <span className="text-xs text-gray-500">
                        Creator rating:
                      </span>
                      <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span
                            key={star}
                            className={`text-xs ${
                              star <= recipe.creator_rating!
                                ? 'text-orange-400'
                                : 'text-gray-300'
                            }`}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                      <span className="text-xs text-gray-500">
                        ({recipe.creator_rating}/5)
                      </span>
                    </div>
                  )}
                </div>

                {isOwner && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCreateVersion(true)}
                  >
                    Create New Version
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        <RecipeView
          recipe={recipe}
          onEdit={shouldShowEdit ? handleEdit : undefined}
          onSave={shouldShowSave ? handleSave : undefined}
          onBack={!versions.length ? handleBack : undefined} // Hide back button if we have version nav
          communityRating={communityRating}
          onCommunityRate={handleCommunityRating}
          ratingLoading={ratingLoading}
        />

        {/* Version Selection Modal */}
        {showVersions && versions.length > 0 && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Recipe Versions</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowVersions(false)}
                  >
                    ✕
                  </Button>
                </div>

                <div className="max-h-[60vh] overflow-y-auto">
                  <VersionSelector
                    originalRecipeId={
                      recipe?.parent_recipe_id || recipe?.id || ''
                    }
                    currentVersionNumber={currentVersionNumber}
                    onVersionSelect={handleVersionSelect}
                    onRateVersion={handleVersionRating}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create Version Modal */}
        {showCreateVersion && recipe && (
          <CreateVersionModal
            originalRecipe={recipe}
            onVersionCreated={handleVersionCreated}
            onClose={() => setShowCreateVersion(false)}
          />
        )}
      </div>
    </div>
  );
}
