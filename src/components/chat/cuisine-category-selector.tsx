import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CategoryFilter } from '@/components/ui/category-filter';
import { CuisineFilter } from '@/components/ui/cuisine-filter';
import { MoodFilter } from '@/components/ui/mood-filter';
import CategoryChip from '@/components/ui/CategoryChip';
import { CANONICAL_CATEGORIES } from '@/lib/categories';
import { CUISINE_OPTIONS } from '@/lib/cuisines';
import { MOOD_OPTIONS } from '@/lib/moods';

export interface CuisineCategorySelectorProps {
  onSelectionChange: (selection: {
    categories: string[];
    cuisines: string[];
    moods: string[];
  }) => void;
  className?: string;
}

export function CuisineCategorySelector({
  onSelectionChange,
  className = '',
}: CuisineCategorySelectorProps) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedCuisines, setSelectedCuisines] = useState<string[]>([]);
  const [selectedMoods, setSelectedMoods] = useState<string[]>([]);

  const handleCategoriesChange = (categories: string[]) => {
    setSelectedCategories(categories);
    onSelectionChange({
      categories,
      cuisines: selectedCuisines,
      moods: selectedMoods,
    });
  };

  const handleCuisinesChange = (cuisines: string[]) => {
    setSelectedCuisines(cuisines);
    onSelectionChange({
      categories: selectedCategories,
      cuisines,
      moods: selectedMoods,
    });
  };

  const handleMoodsChange = (moods: string[]) => {
    setSelectedMoods(moods);
    onSelectionChange({
      categories: selectedCategories,
      cuisines: selectedCuisines,
      moods,
    });
  };

  const removeCategory = (category: string) => {
    const newCategories = selectedCategories.filter(c => c !== category);
    setSelectedCategories(newCategories);
    onSelectionChange({
      categories: newCategories,
      cuisines: selectedCuisines,
      moods: selectedMoods,
    });
  };

  const removeCuisine = (cuisine: string) => {
    const newCuisines = selectedCuisines.filter(c => c !== cuisine);
    setSelectedCuisines(newCuisines);
    onSelectionChange({
      categories: selectedCategories,
      cuisines: newCuisines,
      moods: selectedMoods,
    });
  };

  const removeMood = (mood: string) => {
    const newMoods = selectedMoods.filter(m => m !== mood);
    setSelectedMoods(newMoods);
    onSelectionChange({
      categories: selectedCategories,
      cuisines: selectedCuisines,
      moods: newMoods,
    });
  };

  const clearAllSelections = () => {
    setSelectedCategories([]);
    setSelectedCuisines([]);
    setSelectedMoods([]);
    onSelectionChange({
      categories: [],
      cuisines: [],
      moods: [],
    });
  };

  const hasSelections = selectedCategories.length > 0 || selectedCuisines.length > 0 || selectedMoods.length > 0;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Selection Controls - Same layout as FilterBar */}
      <div className="flex justify-between items-center gap-2">
        {/* Left side - Categories Filter */}
        <CategoryFilter
          selectedCategories={selectedCategories}
          onCategoriesChange={handleCategoriesChange}
          availableCategories={CANONICAL_CATEGORIES}
          placeholder="Select categories..."
          className="flex-1"
        />

        {/* Right side - Other selectors grouped together */}
        <div className="flex gap-2">
          {/* Cuisine Filter */}
          <CuisineFilter
            selectedCuisines={selectedCuisines}
            onCuisinesChange={handleCuisinesChange}
            availableCuisines={CUISINE_OPTIONS}
            placeholder="Select cuisines..."
            className="w-48"
          />

          {/* Mood Filter */}
          <MoodFilter
            selectedMoods={selectedMoods}
            onMoodsChange={handleMoodsChange}
            availableMoods={MOOD_OPTIONS}
            placeholder="Select moods..."
            className="w-48"
          />

          {/* Clear Selections */}
          {hasSelections && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllSelections}
              className="text-gray-500 hover:text-gray-700"
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
              onRemove={() => removeCategory(category)}
              variant="removable"
            />
          ))}

          {/* Cuisine Chips */}
          {selectedCuisines.map((cuisine) => (
            <CategoryChip
              key={cuisine}
              category={cuisine}
              onRemove={() => removeCuisine(cuisine)}
              variant="removable"
            />
          ))}

          {/* Mood Chips */}
          {selectedMoods.map((mood) => (
            <CategoryChip
              key={mood}
              category={mood}
              onRemove={() => removeMood(mood)}
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
                  {selectedCategories.length} categor{selectedCategories.length === 1 ? 'y' : 'ies'}
                  {(selectedCuisines.length > 0 || selectedMoods.length > 0) && ' and '}
                </span>
              )}
              {selectedCuisines.length > 0 && (
                <span className="ml-2">
                  {selectedCuisines.length} cuisin{selectedCuisines.length === 1 ? 'e' : 'es'}
                  {selectedMoods.length > 0 && ' and '}
                </span>
              )}
              {selectedMoods.length > 0 && (
                <span className="ml-2">
                  {selectedMoods.length} mood{selectedMoods.length === 1 ? '' : 's'}
                </span>
              )}
            </p>
          </div>
        )}
    </div>
  );
}
