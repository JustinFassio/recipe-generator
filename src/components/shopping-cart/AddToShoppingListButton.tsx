import { useState } from 'react';
import { ShoppingCart, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useShoppingList } from '@/hooks/useShoppingList';
import { toast } from '@/hooks/use-toast';

interface AddToShoppingListButtonProps {
  ingredients: string[];
  recipeId?: string;
  recipeTitle?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
  className?: string;
  showCount?: boolean;
}

export function AddToShoppingListButton({
  ingredients,
  recipeId,
  recipeTitle,
  variant = 'outline',
  size = 'sm',
  className = '',
  showCount = true,
}: AddToShoppingListButtonProps) {
  const [isAdding, setIsAdding] = useState(false);
  const { addToShoppingList, isInShoppingList } = useShoppingList();

  const handleAddToShoppingList = async () => {
    if (!ingredients.length) return;

    setIsAdding(true);
    let successCount = 0;

    try {
      // Add each ingredient to the shopping list
      for (const ingredient of ingredients) {
        // Skip if already in shopping list
        if (isInShoppingList(ingredient)) {
          continue;
        }

        // Try to categorize the ingredient (simple heuristic)
        const category = categorizeIngredient(ingredient);

        const success = await addToShoppingList(
          ingredient,
          category,
          'recipe',
          {
            sourceId: recipeId,
            sourceTitle: recipeTitle,
            notes: recipeTitle ? `From recipe: ${recipeTitle}` : undefined,
          }
        );

        if (success) {
          successCount++;
        }
      }

      if (successCount > 0) {
        toast({
          title: 'Added to Shopping List',
          description: `${successCount} ingredient${successCount !== 1 ? 's' : ''} added to your shopping list.`,
        });
      } else {
        toast({
          title: 'Items Already in List',
          description: 'All ingredients are already in your shopping list.',
          variant: 'default',
        });
      }
    } catch (error) {
      console.error('Error adding to shopping list:', error);
      toast({
        title: 'Error',
        description: 'Failed to add ingredients to shopping list.',
        variant: 'destructive',
      });
    } finally {
      setIsAdding(false);
    }
  };

  // Count how many ingredients are NOT already in the shopping list
  const newIngredientsCount = ingredients.filter(
    (ingredient) => !isInShoppingList(ingredient)
  ).length;

  const buttonText = showCount
    ? `Add to Shopping List${newIngredientsCount > 0 ? ` (${newIngredientsCount})` : ''}`
    : 'Add to Shopping List';

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleAddToShoppingList}
      disabled={isAdding || newIngredientsCount === 0}
    >
      {isAdding ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Adding...
        </>
      ) : newIngredientsCount === 0 ? (
        <>
          <Check className="w-4 h-4 mr-2" />
          All in List
        </>
      ) : (
        <>
          <ShoppingCart className="w-4 h-4 mr-2" />
          {buttonText}
        </>
      )}
    </Button>
  );
}

/**
 * Simple ingredient categorization heuristic
 * Maps ingredient names to likely categories
 */
function categorizeIngredient(ingredient: string): string {
  const name = ingredient.toLowerCase();

  // Spices and seasonings
  if (
    name.includes('oregano') ||
    name.includes('cumin') ||
    name.includes('paprika') ||
    name.includes('chili') ||
    name.includes('pepper') ||
    name.includes('salt') ||
    name.includes('garlic powder') ||
    name.includes('onion powder') ||
    name.includes('thyme') ||
    name.includes('rosemary') ||
    name.includes('sage') ||
    name.includes('cinnamon') ||
    name.includes('nutmeg')
  ) {
    return 'flavor_builders';
  }

  // Fresh produce
  if (
    name.includes('onion') ||
    name.includes('tomato') ||
    name.includes('pepper') ||
    name.includes('cilantro') ||
    name.includes('basil') ||
    name.includes('lime') ||
    name.includes('lemon') ||
    name.includes('avocado') ||
    name.includes('jalapeño') ||
    name.includes('carrot') ||
    name.includes('celery') ||
    name.includes('mushroom') ||
    name.includes('spinach') ||
    name.includes('lettuce') ||
    name.includes('potato') ||
    name.includes('garlic')
  ) {
    return 'fresh_produce';
  }

  // Dairy
  if (
    name.includes('cheese') ||
    name.includes('milk') ||
    name.includes('butter') ||
    name.includes('cream') ||
    name.includes('yogurt') ||
    name.includes('sour cream')
  ) {
    return 'dairy_cold';
  }

  // Oils and cooking essentials
  if (
    name.includes('oil') ||
    name.includes('vinegar') ||
    name.includes('wine') ||
    name.includes('stock') ||
    name.includes('broth')
  ) {
    return 'cooking_essentials';
  }

  // Pantry staples
  if (
    name.includes('flour') ||
    name.includes('sugar') ||
    name.includes('rice') ||
    name.includes('pasta') ||
    name.includes('beans') ||
    name.includes('sauce') ||
    name.includes('honey') ||
    name.includes('maple syrup') ||
    name.includes('baking powder') ||
    name.includes('baking soda')
  ) {
    return 'pantry_staples';
  }

  // Proteins
  if (
    name.includes('chicken') ||
    name.includes('beef') ||
    name.includes('pork') ||
    name.includes('fish') ||
    name.includes('egg') ||
    name.includes('tofu') ||
    name.includes('turkey') ||
    name.includes('salmon') ||
    name.includes('shrimp')
  ) {
    return 'proteins';
  }

  // Default to fresh produce for unknown items
  return 'fresh_produce';
}
