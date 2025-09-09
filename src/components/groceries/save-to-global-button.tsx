import { useState, useEffect } from 'react';
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
  const [editableIngredient, setEditableIngredient] =
    useState<string>(ingredient);

  // Reset editable ingredient when the prop changes
  useEffect(() => {
    setEditableIngredient(ingredient);
  }, [ingredient]);

  const handleSave = async () => {
    // Validate that ingredient name is not empty
    if (!editableIngredient.trim()) {
      return;
    }
    const success = await saveIngredientToGlobal(
      editableIngredient.trim(),
      selectedCategory,
      recipeContext
    );
    if (success) {
      // Also add to user's groceries immediately so it appears in the category
      const alreadySelected = groceries.hasIngredient(
        selectedCategory,
        editableIngredient.trim()
      );
      if (!alreadySelected) {
        groceries.toggleIngredient(selectedCategory, editableIngredient.trim());
        await groceries.saveGroceries();
      }
      setIsOpen(false);
      onSaved?.();
    }
  };

  const handleCancel = () => {
    setIsOpen(false);
    setSelectedCategory('pantry'); // Reset to default
    setEditableIngredient(ingredient); // Reset to original parsed name
  };

  const handleOpen = () => {
    setEditableIngredient(ingredient); // Initialize with parsed name
    setIsOpen(true);
  };

  if (!isOpen) {
    return (
      <Button
        variant={variant}
        size={size}
        onClick={handleOpen}
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
        <div className="flex flex-col space-y-2 mb-2">
          <span className="text-sm font-medium text-blue-800">
            Save to Global Ingredients:
          </span>
          <input
            type="text"
            value={editableIngredient}
            onChange={(e) => setEditableIngredient(e.target.value)}
            className="text-sm border border-blue-300 rounded px-2 py-1 bg-white text-blue-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter ingredient name..."
            disabled={loading}
          />
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
          disabled={loading || !editableIngredient.trim()}
          className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
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
