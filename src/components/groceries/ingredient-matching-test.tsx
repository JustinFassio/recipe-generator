import { useIngredientMatching } from '@/hooks/useIngredientMatching';
import { Badge } from '@/components/ui/badge';
import { Check, ShoppingCart } from 'lucide-react';

interface IngredientMatchingTestProps {
  testIngredients?: string[];
}

export function IngredientMatchingTest({
  testIngredients = [
    '2 cups all-purpose flour',
    '1 large onion, diced',
    '3 cloves garlic, minced',
    'Salt and pepper to taste',
    '1 lb ground beef',
    '2 eggs',
    'Fresh basil leaves',
  ],
}: IngredientMatchingTestProps) {
  const ingredientMatching = useIngredientMatching();

  if (!ingredientMatching.isReady) {
    return (
      <div className="p-4 border rounded-lg bg-gray-50">
        <p className="text-gray-600">
          {ingredientMatching.groceriesCount === 0
            ? 'No grocery data available. Please add groceries to test ingredient matching.'
            : 'Loading ingredient matching...'}
        </p>
      </div>
    );
  }

  const getMatchIcon = (matchType: string) => {
    switch (matchType) {
      case 'exact':
        return <Check className="h-4 w-4 text-green-600" />;
      case 'partial':
      case 'fuzzy':
        return <Check className="h-4 w-4 text-yellow-600" />;
      default:
        return <ShoppingCart className="h-4 w-4 text-gray-400" />;
    }
  };

  const getMatchBadge = (matchType: string, confidence: number) => {
    if (matchType === 'none') {
      return (
        <Badge variant="outline" className="text-red-600 bg-red-50">
          Not Available
        </Badge>
      );
    }

    const color =
      matchType === 'exact'
        ? 'bg-green-100 text-green-800'
        : matchType === 'partial'
          ? 'bg-yellow-100 text-yellow-800'
          : 'bg-blue-100 text-blue-800';

    return (
      <Badge variant="outline" className={color}>
        {matchType} ({confidence}%)
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      <div className="p-4 border rounded-lg bg-blue-50">
        <h3 className="font-semibold text-blue-800 mb-2">
          Ingredient Matching Test
        </h3>
        <p className="text-sm text-blue-700">
          Testing with {ingredientMatching.groceriesCount} grocery items
          available
        </p>
      </div>

      <div className="space-y-3">
        {testIngredients.map((ingredient, index) => {
          const match = ingredientMatching.matchIngredient(ingredient);

          return (
            <div key={index} className="p-3 border rounded-lg bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getMatchIcon(match.matchType)}
                  <span className="font-medium">{ingredient}</span>
                </div>
                {getMatchBadge(match.matchType, match.confidence)}
              </div>

              {match.matchedGroceryIngredient && (
                <div className="mt-2 text-sm text-gray-600">
                  <span className="font-medium">Matches:</span>{' '}
                  {match.matchedGroceryIngredient}
                  {match.matchedCategory && (
                    <span className="ml-2 text-gray-500">
                      ({match.matchedCategory})
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="p-4 border rounded-lg bg-gray-50">
        <h4 className="font-medium text-gray-800 mb-2">Summary</h4>
        <div className="text-sm text-gray-600">
          {
            testIngredients.filter((ing) =>
              ingredientMatching.hasIngredient(ing)
            ).length
          }{' '}
          of {testIngredients.length} ingredients available
        </div>
      </div>
    </div>
  );
}
