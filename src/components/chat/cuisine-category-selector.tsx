import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CategoryFilterSection } from '@/components/recipes/filters/CategoryFilterSection';
import { CuisineFilterSection } from '@/components/recipes/filters/CuisineFilterSection';
import { MoodFilterSection } from '@/components/recipes/filters/MoodFilterSection';
import { IngredientFilterSection } from '@/components/recipes/filters/IngredientFilterSection';
import CategoryChip from '@/components/ui/CategoryChip';
import { useSelections } from '@/contexts/SelectionContext';

export interface CuisineCategorySelectorProps {
  onSelectionChange: (selection: {
    categories: string[];
    cuisines: string[];
    moods: string[];
    availableIngredients?: string[];
  }) => void;
  className?: string;
}

export function CuisineCategorySelector({
  onSelectionChange,
  className = '',
}: CuisineCategorySelectorProps) {
  const {
    selections,
    updateSelections,
    clearSelections,
    removeCategory,
    removeCuisine,
    removeMood,
  } = useSelections();

  const {
    categories: selectedCategories,
    cuisines: selectedCuisines,
    moods: selectedMoods,
    availableIngredients: selectedIngredients,
  } = selections;

  const handleCategoriesChange = (categories: string[]) => {
    updateSelections({ categories });
    onSelectionChange({
      categories,
      cuisines: selectedCuisines,
      moods: selectedMoods,
    });
  };

  const handleCuisinesChange = (cuisines: string[]) => {
    updateSelections({ cuisines });
    onSelectionChange({
      categories: selectedCategories,
      cuisines,
      moods: selectedMoods,
    });
  };

  const handleMoodsChange = (moods: string[]) => {
    updateSelections({ moods });
    onSelectionChange({
      categories: selectedCategories,
      cuisines: selectedCuisines,
      moods,
    });
  };

  const handleIngredientsChange = (availableIngredients: string[]) => {
    updateSelections({ availableIngredients });
    onSelectionChange({
      categories: selectedCategories,
      cuisines: selectedCuisines,
      moods: selectedMoods,
      availableIngredients,
    });
  };

  const handleRemoveCategory = (category: string) => {
    removeCategory(category);
    onSelectionChange({
      categories: selectedCategories.filter((c) => c !== category),
      cuisines: selectedCuisines,
      moods: selectedMoods,
    });
  };

  const handleRemoveCuisine = (cuisine: string) => {
    removeCuisine(cuisine);
    onSelectionChange({
      categories: selectedCategories,
      cuisines: selectedCuisines.filter((c) => c !== cuisine),
      moods: selectedMoods,
    });
  };

  const handleRemoveMood = (mood: string) => {
    removeMood(mood);
    onSelectionChange({
      categories: selectedCategories,
      cuisines: selectedCuisines,
      moods: selectedMoods.filter((m) => m !== mood),
    });
  };

  const handleClearAllSelections = () => {
    clearSelections();
    onSelectionChange({
      categories: [],
      cuisines: [],
      moods: [],
    });
  };

  const hasSelections =
    selectedCategories.length > 0 ||
    selectedCuisines.length > 0 ||
    selectedMoods.length > 0 ||
    selectedIngredients.length > 0;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Selection Controls - Mobile responsive layout matching FilterBar */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:space-y-0 sm:gap-4">
        {/* Left side - All selectors grouped together */}
        <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:gap-4">
          {/* Categories Filter */}
          <CategoryFilterSection
            selectedCategories={selectedCategories}
            onCategoriesChange={handleCategoriesChange}
            variant="dropdown"
            className="w-full sm:w-48"
          />

          {/* Cuisine Filter */}
          <CuisineFilterSection
            selectedCuisines={selectedCuisines}
            onCuisinesChange={handleCuisinesChange}
            variant="dropdown"
            className="w-full sm:w-48"
          />

          {/* Mood Filter */}
          <MoodFilterSection
            selectedMoods={selectedMoods}
            onMoodsChange={handleMoodsChange}
            variant="dropdown"
            className="w-full sm:w-48"
          />

          {/* Ingredients Filter */}
          <IngredientFilterSection
            selectedIngredients={selectedIngredients}
            onIngredientsChange={handleIngredientsChange}
            variant="dropdown"
            className="w-full sm:w-48"
          />
        </div>

        {/* Right side - Clear selections button */}
        <div className="flex justify-end sm:ml-auto">
          {hasSelections && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAllSelections}
              className="w-full sm:w-auto text-gray-500 hover:text-gray-700"
            >
              <X className="mr-1 h-4 w-4" />
              Clear All
            </Button>
          )}
        </div>
      </div>

      {/* Selected Items Display - Same style as FilterBar */}
      {hasSelections && (
        <div className="flex flex-wrap gap-2">
          {/* Category Chips */}
          {selectedCategories.map((category) => (
            <CategoryChip
              key={category}
              category={category}
              onRemove={() => handleRemoveCategory(category)}
              variant="removable"
            />
          ))}

          {/* Cuisine Chips */}
          {selectedCuisines.map((cuisine) => (
            <CategoryChip
              key={cuisine}
              category={cuisine}
              onRemove={() => handleRemoveCuisine(cuisine)}
              variant="removable"
            />
          ))}

          {/* Mood Chips */}
          {selectedMoods.map((mood) => (
            <CategoryChip
              key={mood}
              category={mood}
              onRemove={() => handleRemoveMood(mood)}
              variant="removable"
            />
          ))}
        </div>
      )}

      {/* Selection Summary */}
      {hasSelections && (
        <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
          <p>
            <strong>Recipe will include:</strong>
            {selectedCategories.length > 0 && (
              <span className="ml-2">
                {selectedCategories.length} categor
                {selectedCategories.length === 1 ? 'y' : 'ies'}
                {(selectedCuisines.length > 0 || selectedMoods.length > 0) &&
                  ' and '}
              </span>
            )}
            {selectedCuisines.length > 0 && (
              <span className="ml-2">
                {selectedCuisines.length} cuisin
                {selectedCuisines.length === 1 ? 'e' : 'es'}
                {selectedMoods.length > 0 && ' and '}
              </span>
            )}
            {selectedMoods.length > 0 && (
              <span className="ml-2">
                {selectedMoods.length} mood
                {selectedMoods.length === 1 ? '' : 's'}
              </span>
            )}
          </p>
        </div>
      )}
    </div>
  );
}
