// React import not needed
import { Check, ShoppingCart, AlertCircle, Globe } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useIngredientMatching } from '@/hooks/useIngredientMatching';
import { useGlobalIngredients } from '@/hooks/useGlobalIngredients';
import { SaveToGlobalButton } from '@/components/groceries/save-to-global-button';
import { createDaisyUICardClasses } from '@/lib/card-migration';
import type { Recipe } from '@/lib/types';

interface EnhancedRecipeViewWithGlobalProps {
  recipe: Recipe;
  onEdit?: () => void;
  onBack?: () => void;
}

export function EnhancedRecipeViewWithGlobal({
  recipe,
}: EnhancedRecipeViewWithGlobalProps) {
  const ingredientMatching = useIngredientMatching();
  void useGlobalIngredients();

  const compatibility = ingredientMatching.calculateCompatibility(recipe);
  const availabilityPercentage = compatibility.compatibilityScore;

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

    const variant = match.matchType === 'exact' ? 'default' : 'secondary';
    const text = match.matchType === 'exact' ? 'You have this' : 'Similar item';

    return (
      <Badge variant={variant} className="ml-2 text-xs">
        {text}
      </Badge>
    );
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Grocery Compatibility Section */}
      {ingredientMatching.isReady && ingredientMatching.groceriesCount > 0 && (
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

      {/* Enhanced Ingredients Section */}
      <div className={createDaisyUICardClasses('bordered')}>
        <div className="card-body">
          <h3 className="card-title text-xl font-semibold mb-4">
            Ingredients
            {ingredientMatching.isReady && (
              <span className="text-sm font-normal text-gray-600">
                ({compatibility.availableIngredients.length} available)
              </span>
            )}
          </h3>

          <div className="space-y-3">
            {recipe.ingredients.map((ingredient, index) => {
              const match = ingredientMatching.matchIngredient(ingredient);
              const isAvailable =
                match.matchType !== 'none' && match.confidence >= 50;

              return (
                <div key={index} className="flex items-start">
                  {ingredient.startsWith('---') &&
                  ingredient.endsWith('---') ? (
                    // Category header
                    <div className="w-full">
                      <div className="divider" />
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
                        {getIngredientStatusIcon(match)}
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
                        <div className="flex items-center space-x-2">
                          {getIngredientBadge(match)}
                          {match.matchedGroceryIngredient && (
                            <span className="text-xs text-gray-500">
                              (matches: {match.matchedGroceryIngredient})
                            </span>
                          )}
                          {match.matchType === 'none' && (
                            <SaveToGlobalButton
                              ingredient={ingredient}
                              recipeContext={{
                                recipeId: recipe.id,
                                recipeCategories: recipe.categories || [],
                              }}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Shopping List for Missing Ingredients */}
          {compatibility.missingIngredients.length > 0 && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-800 mb-3 flex items-center">
                <ShoppingCart className="h-4 w-4 mr-2" />
                Shopping List ({compatibility.missingIngredients.length} items)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {compatibility.missingIngredients.map((match, index) => (
                  <div
                    key={index}
                    className="flex items-center text-sm text-blue-700"
                  >
                    <div className="w-2 h-2 bg-blue-400 rounded-full mr-2" />
                    {match.recipeIngredient}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
