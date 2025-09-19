import {
  createDaisyUICardClasses,
  createDaisyUICardTitleClasses,
} from '@/lib/card-migration';
import { createDaisyUIBadgeClasses } from '@/lib/badge-migration';
import { createDaisyUISeparatorClasses } from '@/lib/separator-migration';
import {
  ArrowLeft,
  Clock,
  Users,
  Edit,
  Calendar,
  Check,
  ShoppingCart,
  AlertCircle,
  Globe,
  Save,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import CategoryChip from '@/components/ui/CategoryChip';
import { useMemo } from 'react';
import { useGlobalIngredients } from '@/hooks/useGlobalIngredients';
import { SaveToGlobalButton } from '@/components/groceries/save-to-global-button';
import { parseIngredientText } from '@/lib/groceries/ingredient-parser';
import { EnhancedIngredientMatcher } from '@/lib/groceries/enhanced-ingredient-matcher';
import { useGroceries } from '@/hooks/useGroceries';
import type { Recipe } from '@/lib/types';
import { CreatorRating, CommunityRating } from '@/components/ui/rating';
import { CommentSystem } from './comment-system';

interface RecipeViewProps {
  recipe: Recipe;
  onEdit?: () => void;
  onSave?: () => void;
  onBack?: () => void;
  communityRating?: {
    average: number;
    count: number;
    userRating?: number;
  } | null;
  onCommunityRate?: (rating: number) => void;
  ratingLoading?: boolean;
}

export function RecipeView({
  recipe,
  onEdit,
  onSave,
  onBack,
  communityRating,
  onCommunityRate,
  ratingLoading,
}: RecipeViewProps) {
  const { groceries } = useGroceries();
  const {
    /* saveIngredientToGlobal, */ refreshGlobalIngredients,
    globalIngredients,
  } = useGlobalIngredients();

  // Create enhanced matcher that includes global ingredients
  const enhancedMatcher = useMemo(() => {
    if (Object.keys(groceries).length === 0) return null;
    return new EnhancedIngredientMatcher(groceries);
  }, [groceries, globalIngredients]); // Recreate when global ingredients change

  // Calculate compatibility using enhanced matcher
  const compatibility = useMemo(() => {
    if (!enhancedMatcher) {
      return {
        recipeId: recipe.id,
        totalIngredients: recipe.ingredients.length,
        availableIngredients: [],
        missingIngredients: recipe.ingredients.map((ing) => ({
          recipeIngredient: ing,
          confidence: 0,
          matchType: 'none' as const,
        })),
        compatibilityScore: 0,
        confidenceScore: 0,
      };
    }
    return enhancedMatcher.calculateRecipeCompatibility(recipe);
  }, [enhancedMatcher, recipe]);

  const availabilityPercentage = compatibility.compatibilityScore;
  const missingIngredients = compatibility.missingIngredients;

  const getIngredientStatusIcon = (match: { matchType: string }) => {
    switch (match.matchType) {
      case 'exact':
        return <Check className="h-4 w-4 text-green-600" />;
      case 'partial':
      case 'fuzzy':
        return <Check className="h-4 w-4 text-yellow-600" />;
      case 'global':
        return <Globe className="h-4 w-4 text-blue-600" />;
      default:
        return <ShoppingCart className="h-4 w-4 text-gray-400" />;
    }
  };

  const getIngredientBadge = (match: { matchType: string }) => {
    if (match.matchType === 'none') {
      return (
        <Badge variant="outline" className="text-red-600 bg-red-50">
          Not Available
        </Badge>
      );
    }

    if (match.matchType === 'global') {
      return (
        <Badge variant="outline" className="text-blue-600 bg-blue-50">
          Global Ingredient
        </Badge>
      );
    }

    const variant = match.matchType === 'exact' ? 'default' : 'outline';
    const text = match.matchType === 'exact' ? 'You have this' : 'Similar item';

    return (
      <Badge
        variant={variant}
        className={`ml-2 text-xs ${
          match.matchType === 'exact'
            ? 'bg-green-100 text-green-800 border-green-300'
            : 'bg-amber-50 text-amber-700 border-amber-300'
        }`}
      >
        {text}
      </Badge>
    );
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        {onBack && (
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Recipes
          </Button>
        )}
        {onEdit && (
          <Button onClick={onEdit}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Recipe
          </Button>
        )}
        {onSave && (
          <Button onClick={onSave}>
            <Save className="mr-2 h-4 w-4" />
            Save Recipe
          </Button>
        )}
      </div>

      {/* Recipe Header */}
      <div className={createDaisyUICardClasses('bordered')}>
        <div className="card-body pb-4">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
            {recipe.image_url && (
              <div className="lg:w-1/3">
                <img
                  src={recipe.image_url}
                  alt={recipe.title}
                  className="h-48 w-full rounded-lg object-cover sm:h-64 lg:h-48"
                />
              </div>
            )}
            <div className="flex-1">
              <h3
                className={`${createDaisyUICardTitleClasses()} mb-2 text-xl font-bold sm:text-2xl lg:text-3xl`}
              >
                {recipe.title}
              </h3>
              
              {/* Recipe Description */}
              {recipe.description && (
                <div className="mb-4">
                  <p className="text-base text-gray-700 leading-relaxed">
                    {recipe.description}
                  </p>
                </div>
              )}
              
              <div className="flex flex-col gap-2 text-sm text-gray-600 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
                <div className="flex items-center">
                  <Users className="mr-1 h-4 w-4" />
                  <span className={createDaisyUIBadgeClasses('secondary')}>
                    {recipe.ingredients.length} ingredients
                  </span>
                </div>
                <div className="flex items-center">
                  <Calendar className="mr-1 h-4 w-4" />
                  <span>
                    Added {new Date(recipe.created_at).toLocaleDateString()}
                  </span>
                </div>
                {recipe.updated_at !== recipe.created_at && (
                  <div className="flex items-center">
                    <Clock className="mr-1 h-4 w-4" />
                    <span>
                      Updated {new Date(recipe.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>

              {/* Recipe Tags */}
              {recipe.categories && recipe.categories.length > 0 && (
                <div className="mt-4">
                  <div className="flex flex-wrap gap-2">
                    {recipe.categories.map((category, index) => (
                      <CategoryChip
                        key={`${category}-${index}`}
                        category={category}
                        variant="readonly"
                        size="sm"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Creator Rating */}
              {recipe.creator_rating && (
                <div className="mt-4">
                  <CreatorRating
                    rating={recipe.creator_rating}
                    disabled={true}
                    className="max-w-xs"
                  />
                </div>
              )}

              {/* Community Rating */}
              {communityRating && communityRating.count > 0 && (
                <div className="mt-4">
                  <CommunityRating
                    averageRating={communityRating.average}
                    totalRatings={communityRating.count}
                    userRating={communityRating.userRating}
                    onRate={onCommunityRate}
                    className="max-w-xs"
                  />
                </div>
              )}

              {/* Community Rating Loading */}
              {ratingLoading && (
                <div className="mt-4 max-w-xs">
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-center">
                      <div className="loading loading-spinner loading-sm text-blue-600"></div>
                      <span className="ml-2 text-sm text-blue-700">
                        Loading ratings...
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Grocery Compatibility Section */}
      {enhancedMatcher && Object.keys(groceries).length > 0 && (
        <div
          className={createDaisyUICardClasses(
            'bordered bg-gradient-to-r from-green-50 to-blue-50'
          )}
        >
          <div className="card-body">
            <div className="flex items-center justify-between mb-4">
              <h3 className="card-title text-green-800">
                <ShoppingCart className="h-5 w-5 mr-2" />
                Grocery Compatibility
              </h3>
              <div className="text-right">
                <div className="text-3xl font-bold text-green-600">
                  {availabilityPercentage}%
                </div>
                <div className="text-sm text-green-700">
                  {compatibility.availableIngredients.length} of{' '}
                  {compatibility.totalIngredients} ingredients
                </div>
              </div>
            </div>

            {/* Compatibility Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
              <div
                className={`h-3 rounded-full transition-all duration-500 ${
                  availabilityPercentage >= 80
                    ? 'bg-green-500'
                    : availabilityPercentage >= 60
                      ? 'bg-yellow-500'
                      : availabilityPercentage >= 40
                        ? 'bg-orange-500'
                        : 'bg-red-500'
                }`}
                style={{ width: `${availabilityPercentage}%` }}
              />
            </div>

            {/* Compatibility Messages */}
            {availabilityPercentage >= 80 && (
              <div className="alert alert-success">
                <Check className="h-4 w-4" />
                <span>Excellent match! You have most ingredients needed.</span>
              </div>
            )}

            {availabilityPercentage >= 50 && availabilityPercentage < 80 && (
              <div className="alert alert-info">
                <AlertCircle className="h-4 w-4" />
                <span>
                  Good match! You have many of the ingredients needed.
                </span>
              </div>
            )}

            {availabilityPercentage < 50 && (
              <div className="alert alert-warning">
                <AlertCircle className="h-4 w-4" />
                <span>
                  You'll need to shop for several ingredients for this recipe.
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Ingredients */}
      <div className={createDaisyUICardClasses('bordered')}>
        <div className="card-body">
          <h3 className="card-title text-xl font-semibold mb-4">
            Ingredients
            {enhancedMatcher && (
              <span className="text-sm font-normal text-gray-600">
                ({compatibility.availableIngredients.length} available)
              </span>
            )}
          </h3>

          <div className="space-y-3">
            {recipe.ingredients.map((ingredient, index) => {
              const match = enhancedMatcher
                ? enhancedMatcher.matchIngredient(ingredient)
                : {
                    recipeIngredient: ingredient,
                    confidence: 0,
                    matchType: 'none' as const,
                  };
              const isAvailable =
                match.matchType !== 'none' && match.confidence >= 50;

              return (
                <div key={index} className="flex items-start">
                  {ingredient.startsWith('---') &&
                  ingredient.endsWith('---') ? (
                    // Category header (existing code)
                    <div className="w-full">
                      <div
                        className={createDaisyUISeparatorClasses(
                          'horizontal',
                          'mb-2'
                        )}
                      />
                      <h4 className="mb-2 text-lg font-semibold text-gray-800">
                        {ingredient
                          .replace(/^---\s*/, '')
                          .replace(/\s*---$/, '')}
                      </h4>
                    </div>
                  ) : (
                    // Enhanced ingredient with availability indicator
                    <div className="flex items-center w-full">
                      <div className="mt-0.5 mr-3 flex h-6 w-6 flex-shrink-0 items-center justify-center">
                        {enhancedMatcher ? (
                          getIngredientStatusIcon(match)
                        ) : (
                          <div className="h-2 w-2 rounded-full bg-orange-500"></div>
                        )}
                      </div>
                      <div className="flex-1 flex items-center justify-between">
                        <p
                          className={`leading-relaxed ${
                            isAvailable
                              ? 'text-gray-900 font-medium'
                              : 'text-gray-700'
                          }`}
                        >
                          {ingredient}
                        </p>
                        {enhancedMatcher && (
                          <div className="flex items-center space-x-2">
                            {getIngredientBadge(match)}
                            {match.matchedGroceryIngredient && (
                              <span className="text-xs text-gray-500">
                                (matches: {match.matchedGroceryIngredient})
                              </span>
                            )}
                            {match.matchType === 'none' && (
                              <SaveToGlobalButton
                                ingredient={
                                  parseIngredientText(ingredient).name
                                }
                                recipeContext={{
                                  recipeId: recipe.id,
                                  recipeCategories: recipe.categories || [],
                                }}
                                onSaved={refreshGlobalIngredients}
                              />
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Shopping List for Missing Ingredients */}
          {missingIngredients.length > 0 && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-800 mb-3 flex items-center">
                <ShoppingCart className="h-4 w-4 mr-2" />
                Shopping List ({missingIngredients.length} items)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {missingIngredients.map((match, index) => (
                  <div
                    key={index}
                    className="flex items-center text-sm text-blue-700"
                  >
                    <div className="w-2 h-2 bg-blue-400 rounded-full mr-2" />
                    {match.recipeIngredient}
                  </div>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 border-blue-300 text-blue-700 hover:bg-blue-100"
                onClick={() => {
                  // Export shopping list as a text file
                  const text = missingIngredients
                    .map((match) => match.recipeIngredient)
                    .join('\n');
                  const blob = new Blob([text], { type: 'text/plain' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'shopping-list.txt';
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                }}
              >
                📋 Export Shopping List
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Setup */}
      {recipe.setup && recipe.setup.length > 0 && (
        <div className={createDaisyUICardClasses('bordered')}>
          <div className="card-body">
            <h3
              className={`${createDaisyUICardTitleClasses()} text-xl font-semibold`}
            >
              Setup & Preparation
            </h3>
            <div className="space-y-3">
              {recipe.setup.map((step, index) => (
                <div key={index} className="flex items-start">
                  <div className="mt-0.5 mr-4 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-100">
                    <span className="text-sm font-semibold text-blue-700">
                      {index + 1}
                    </span>
                  </div>
                  <div className="flex-1 pt-1">
                    <p className="text-gray-800 leading-relaxed">{step}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className={createDaisyUICardClasses('bordered')}>
        <div className="card-body">
          <h3
            className={`${createDaisyUICardTitleClasses()} text-xl font-semibold`}
          >
            Instructions
          </h3>
          <div className="space-y-4">
            {recipe.instructions.split('\n').map((line, index) => {
              const trimmedLine = line.trim();

              if (!trimmedLine) return null;

              // Check if it's a section header (starts with **)
              if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**')) {
                return (
                  <div key={index} className="mt-6 first:mt-0">
                    <div
                      className={createDaisyUISeparatorClasses(
                        'horizontal',
                        'mb-3'
                      )}
                    />
                    <h4 className="text-lg font-semibold text-gray-800">
                      {trimmedLine.replace(/\*\*/g, '')}
                    </h4>
                  </div>
                );
              }

              // Check if it's a numbered step
              const numberedMatch = trimmedLine.match(/^(\d+)\.\s*(.+)$/);
              if (numberedMatch) {
                return (
                  <div key={index} className="flex items-start">
                    <div className="mt-0.5 mr-4 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-teal-100">
                      <span className="text-sm font-semibold text-teal-700">
                        {numberedMatch[1]}
                      </span>
                    </div>
                    <p className="pt-1 leading-relaxed text-gray-700">
                      {numberedMatch[2]}
                    </p>
                  </div>
                );
              }

              // Regular paragraph
              return (
                <p key={index} className="ml-12 leading-relaxed text-gray-700">
                  {trimmedLine}
                </p>
              );
            })}
          </div>
        </div>
      </div>

      {/* Notes */}
      {recipe.notes && (
        <div className={createDaisyUICardClasses('bordered')}>
          <div className="card-body">
            <h3
              className={`${createDaisyUICardTitleClasses()} text-xl font-semibold`}
            >
              Notes
            </h3>
            <div className="space-y-4">
              {recipe.notes.split('\n').map((line, index) => {
                const trimmedLine = line.trim();

                if (!trimmedLine) return null;

                // Check if it's a section header (starts with **)
                if (
                  trimmedLine.startsWith('**') &&
                  trimmedLine.endsWith('**')
                ) {
                  return (
                    <div key={index} className="mt-6 first:mt-0">
                      <h4 className="mb-2 text-lg font-semibold text-gray-800">
                        {trimmedLine.replace(/\*\*/g, '')}
                      </h4>
                    </div>
                  );
                }

                // Check if it's a bullet point
                if (
                  trimmedLine.startsWith('•') ||
                  trimmedLine.startsWith('-')
                ) {
                  return (
                    <div key={index} className="flex items-start">
                      <div className="mt-2.5 mr-3 h-2 w-2 flex-shrink-0 rounded-full bg-gray-400"></div>
                      <p className="leading-relaxed text-gray-700">
                        {trimmedLine.replace(/^[•-]\s*/, '')}
                      </p>
                    </div>
                  );
                }

                // Regular paragraph
                return (
                  <p key={index} className="leading-relaxed text-gray-700">
                    {trimmedLine}
                  </p>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Comments Section for Public Recipes */}
      {recipe.is_public && (
        <div className={createDaisyUICardClasses('bordered')}>
          <div className="card-body">
            <CommentSystem
              recipeId={recipe.id}
              versionNumber={1}
              className="mt-6"
            />
          </div>
        </div>
      )}
    </div>
  );
}
