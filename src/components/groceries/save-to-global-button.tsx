import { useState } from 'react';
import { Plus, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGlobalIngredients } from '@/hooks/useGlobalIngredients';
import { useGroceries } from '@/hooks/useGroceries';
import { GROCERY_CATEGORIES } from '@/lib/groceries/categories';

interface SaveToGlobalButtonProps {
  ingredient: string;
  recipeContext?: {
    recipeId: string;
    recipeCategories: string[];
  };
  onSaved?: () => void;
  size?: 'default' | 'sm' | 'lg' | 'icon';
  variant?: 'default' | 'outline' | 'ghost';
}

export function SaveToGlobalButton({
  ingredient,
  recipeContext,
  onSaved,
  size = 'sm',
  variant = 'outline',
}: SaveToGlobalButtonProps) {
  const { saveIngredientToGlobal, loading } = useGlobalIngredients();
  const groceries = useGroceries();
  const [selectedCategory, setSelectedCategory] = useState<string>('pantry');
  const [isOpen, setIsOpen] = useState(false);

  const handleSave = async () => {
    const success = await saveIngredientToGlobal(
      ingredient,
      selectedCategory,
      recipeContext
    );
    if (success) {
      // Also add to user's groceries immediately so it appears in the category
      const alreadySelected = groceries.hasIngredient(
        selectedCategory,
        ingredient
      );
      if (!alreadySelected) {
        groceries.toggleIngredient(selectedCategory, ingredient);
        await groceries.saveGroceries();
      }
      setIsOpen(false);
      onSaved?.();
    }
  };

  const handleCancel = () => {
    setIsOpen(false);
    setSelectedCategory('pantry'); // Reset to default
  };

  if (!isOpen) {
    return (
      <Button
        variant={variant}
        size={size}
        onClick={() => setIsOpen(true)}
        className="text-blue-600 border-blue-300 hover:bg-blue-50"
        disabled={loading}
      >
        <Plus className="h-3 w-3 mr-1" />
        Save as Global
      </Button>
    );
  }

  return (
    <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
      <div className="flex-1">
        <div className="flex items-center space-x-2 mb-2">
          <span className="text-sm font-medium text-blue-800">
            Save to Global Ingredients:
          </span>
          <span className="text-sm text-blue-700 font-medium">
            "{ingredient}"
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs text-blue-700">Category:</span>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs border rounded px-2 py-1 bg-white"
            disabled={loading}
          >
            {Object.entries(GROCERY_CATEGORIES).map(([key, category]) => (
              <option key={key} value={key}>
                {category.icon} {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center space-x-1">
        <Button
          size="sm"
          onClick={handleSave}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {loading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Plus className="h-3 w-3" />
          )}
          Save
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleCancel}
          disabled={loading}
          className="text-gray-500 hover:text-gray-700"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
