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
  Plus,
  Shield,
} from 'lucide-react';
import { ProgressiveImage } from '@/components/shared/ProgressiveImage';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import CategoryChip from '@/components/ui/CategoryChip';
import { useMemo, useState, useEffect } from 'react';
import { useGlobalIngredients } from '@/hooks/useGlobalIngredients';
import { SaveToGlobalButton } from '@/components/groceries/save-to-global-button';
import { GroceryCard } from '@/components/groceries/GroceryCard';
import { parseIngredientText } from '@/lib/groceries/ingredient-parser';
import { EnhancedIngredientMatcher } from '@/lib/groceries/enhanced-ingredient-matcher';
import { useGroceries } from '@/hooks/useGroceries';
import { useIngredientMatching } from '@/hooks/useIngredientMatching';
import type { Recipe } from '@/lib/types';
import { CreatorRating, YourComment } from '@/components/ui/rating';
import { CommentSystem } from './comment-system';
import { AddToShoppingListButton } from '@/components/shopping-cart/AddToShoppingListButton';
import { useUserGroceryCart } from '@/hooks/useUserGroceryCart';

interface RecipeViewProps {
  recipe: Recipe;
  onEdit?: () => void;
  onSave?: () => void;
  onBack?: () => void;
  userComment?: {
    rating?: number;
    comment?: string;
  } | null;
  onEditComment?: () => void;
}

export function RecipeView({
  recipe,
  onEdit,
  onSave,
  onBack,
  userComment,
  onEditComment,
}: RecipeViewProps) {
  const groceries = useGroceries();
  const {
    /* saveIngredientToGlobal, */ refreshGlobalIngredients,
    globalIngredients,
    getGlobalIngredient,
  } = useGlobalIngredients();

  // Use basic ingredient matching for grocery compatibility (user's actual groceries only)
  const basicIngredientMatching = useIngredientMatching();

  // Use user grocery cart to check if ingredients are in user's collection
  const { isInCart, addToCart, loading: cartLoading } = useUserGroceryCart();

  // Simple state to track clicked ingredients (immediate UI feedback)
  const [clickedIngredients, setClickedIngredients] = useState<Set<string>>(
    new Set()
  );

  // Create enhanced matcher that includes global ingredients (for individual ingredient workflow)
  const [enhancedMatcher, setEnhancedMatcher] =
    useState<EnhancedIngredientMatcher | null>(null);

  // Initialize enhanced matcher when groceries or global ingredients change
  useEffect(() => {
    const initializeMatcher = async () => {
      // Always initialize matcher, even with empty groceries for new users
      // This allows global ingredients to load and shopping functionality to work
      const matcher = new EnhancedIngredientMatcher(groceries.groceries);
      await matcher.initialize();
      setEnhancedMatcher(matcher);
    };

    initializeMatcher();
  }, [groceries.groceries, globalIngredients]);

  // Calculate ACTUAL grocery compatibility using basic matcher (user's groceries only)
  const groceryCompatibility = useMemo(() => {
    return basicIngredientMatching.calculateCompatibility(recipe);
  }, [basicIngredientMatching, recipe]);

  // Calculate enhanced compatibility for individual ingredient workflow (includes global ingredients)
  const enhancedCompatibility = useMemo(() => {
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

  // Use grocery compatibility for the compatibility section (user's actual groceries)
  const availabilityPercentage = groceryCompatibility.compatibilityScore;

  // Use grocery compatibility for shopping list (what user actually needs to buy)
  // Filter out ingredients that are marked as "available" in groceries
  const missingIngredients = useMemo(() => {
    return groceryCompatibility.missingIngredients.filter((match) => {
      const parsedIngredient = parseIngredientText(match.recipeIngredient);

      // Check all categories to see if ingredient is marked as available
      for (const ingredients of Object.values(groceries.groceries)) {
        if (ingredients.includes(parsedIngredient.name)) {
          return false; // Ingredient is available, exclude from shopping list
        }
      }

      return true; // Ingredient not available, include in shopping list
    });
  }, [groceryCompatibility.missingIngredients, groceries.groceries]);

  // Handle adding global ingredients to user's grocery collection
  const handleAddToGroceries = async (category: string, name: string) => {
    // IMMEDIATELY mark as clicked (hide button right away)
    setClickedIngredients((prev) => new Set([...prev, name]));

    // Then do the actual add (in background)
    try {
      const success = await addToCart(category, name);

      if (success) {
        // IMPORTANT: Mark ingredient as "available" by default when added from recipe
        // This ensures it appears as selected (blue) in groceries and is excluded from shopping list
        groceries.toggleIngredient(category, name);

        // Refresh groceries state to sync with database
        await groceries.loadGroceries();
      }

      return success;
    } catch (error) {
      console.error('Failed to add ingredient to cart:', error);
      // On error, remove from clicked state so button reappears
      setClickedIngredients((prev) => {
        const newSet = new Set(prev);
        newSet.delete(name);
        return newSet;
      });
      return false;
    }
  };

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
        <AddToShoppingListButton
          ingredients={recipe.ingredients}
          recipeId={recipe.id}
          recipeTitle={recipe.title}
          variant="outline"
          size="default"
          showCount={false}
        />
      </div>

      {/* Recipe Header */}
      <div className={createDaisyUICardClasses('bordered')}>
        <div className="card-body pb-4">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
            {recipe.image_url && (
              <div className="lg:w-1/3">
                <ProgressiveImage
                  src={recipe.image_url}
                  alt={recipe.title}
                  className="h-48 w-full rounded-lg sm:h-64 lg:h-48"
                  loading="eager"
                  placeholder="/recipe-generator-logo.png"
                />
              </div>
            )}
            <div className="flex-1">
              <h3
                className={`${createDaisyUICardTitleClasses()} mb-4 text-xl font-bold sm:text-2xl lg:text-3xl`}
              >
                {recipe.title}
              </h3>

              {/* Recipe Description */}
              {recipe.description && (
                <div className="mb-4">
                  <p className="text-lg text-gray-700 leading-relaxed">
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

              {/* Your Comment */}
              {userComment && (userComment.rating || userComment.comment) && (
                <div className="mt-4">
                  <YourComment
                    userRating={userComment.rating}
                    userComment={userComment.comment}
                    onEdit={onEditComment}
                    className="max-w-xs"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Grocery Compatibility Section */}
      {enhancedMatcher && Object.keys(groceries.groceries).length > 0 && (
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
                  {groceryCompatibility.availableIngredients.length} of{' '}
                  {groceryCompatibility.totalIngredients} ingredients
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
                ({enhancedCompatibility.availableIngredients.length} available)
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
                    <>
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
                              {match.matchType === 'global' && (
                                <>
                                  {(() => {
                                    // Find the actual global ingredient data using the normalized name
                                    const parsedIngredient =
                                      parseIngredientText(ingredient);
                                    const normalizedName =
                                      enhancedMatcher?.normalizeName(
                                        parsedIngredient.name
                                      ) || parsedIngredient.name.toLowerCase();
                                    const globalIngredient =
                                      getGlobalIngredient(normalizedName);

                                    // Create a GlobalIngredient object from the match data if lookup fails
                                    const globalIngredientData =
                                      globalIngredient || {
                                        id: `global-${match.matchedGroceryIngredient}`,
                                        name:
                                          match.matchedGroceryIngredient ||
                                          parsedIngredient.name,
                                        normalized_name:
                                          enhancedMatcher.normalizeName(
                                            match.matchedGroceryIngredient ||
                                              parsedIngredient.name
                                          ),
                                        category:
                                          match.matchedCategory || 'pantry',
                                        synonyms: [],
                                        usage_count: 1,
                                        first_seen_at: new Date().toISOString(),
                                        last_seen_at: new Date().toISOString(),
                                        created_by: null,
                                        is_verified: false,
                                        is_system: true,
                                        created_at: new Date().toISOString(),
                                        updated_at: new Date().toISOString(),
                                      };

                                    // Check if ingredient should show Add button or Shopping List button
                                    const wasClicked = clickedIngredients.has(
                                      globalIngredientData.name
                                    );
                                    const isAlreadyInCart = isInCart(
                                      globalIngredientData.name
                                    );
                                    const shouldShowButton =
                                      !wasClicked && !isAlreadyInCart;

                                    return shouldShowButton ? (
                                      <div className="inline-flex items-center rounded border p-1 bg-white text-xs max-w-xs">
                                        <div className="min-w-0 mr-2">
                                          <div className="font-medium truncate">
                                            {globalIngredientData.name}
                                          </div>
                                          {globalIngredientData.is_system && (
                                            <span className="inline-flex items-center text-[9px] px-1 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                                              <Shield className="h-2 w-2 mr-0.5" />{' '}
                                              System
                                            </span>
                                          )}
                                        </div>
                                        <Button
                                          size="sm"
                                          onClick={() =>
                                            handleAddToGroceries(
                                              globalIngredientData.category,
                                              globalIngredientData.name
                                            )
                                          }
                                          disabled={cartLoading}
                                          className="h-6 px-2 text-xs"
                                        >
                                          <Plus className="h-2 w-2 mr-1" /> Add
                                        </Button>
                                      </div>
                                    ) : (
                                      // Show GroceryCard for ingredients already in cart (to toggle availability)
                                      <GroceryCard
                                        ingredient={globalIngredientData.name}
                                        category={globalIngredientData.category}
                                        loading={cartLoading}
                                        className="text-xs h-6 px-2"
                                        isSelected={groceries.hasIngredient(
                                          globalIngredientData.category,
                                          globalIngredientData.name
                                        )}
                                        onToggle={groceries.toggleIngredient}
                                      />
                                    );
                                  })()}
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* Shopping List for Missing Ingredients */}
          {enhancedMatcher && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-800 mb-3 flex items-center">
                <ShoppingCart className="h-4 w-4 mr-2" />
                Shopping List ({missingIngredients.length} items)
              </h4>
              {missingIngredients.length > 0 ? (
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
              ) : (
                <div className="text-center py-4">
                  <Check className="h-8 w-8 mx-auto text-green-600 mb-2" />
                  <p className="text-green-700 font-medium">
                    You have all ingredients!
                  </p>
                  <p className="text-green-600 text-sm">
                    No shopping needed for this recipe.
                  </p>
                </div>
              )}
              {missingIngredients.length > 0 && (
                <div className="flex gap-2 mt-3">
                  <AddToShoppingListButton
                    ingredients={missingIngredients.map(
                      (match) => match.recipeIngredient
                    )}
                    recipeId={recipe.id}
                    recipeTitle={recipe.title}
                    variant="outline"
                    size="sm"
                    className="border-blue-300 text-blue-700 hover:bg-blue-100"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-blue-300 text-blue-700 hover:bg-blue-100"
                    onClick={() => {
                      // Export shopping list as a text file
                      const text = missingIngredients
                        .map((match) => match.recipeIngredient)
                        .join('\n');
                      const blob = new Blob([text], { type: 'text/plain' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `${recipe.title}-shopping-list.txt`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                    }}
                  >
                    📋 Export as File
                  </Button>
                </div>
              )}
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
