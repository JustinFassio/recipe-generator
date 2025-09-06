import React, { useState } from 'react';
import { FieldLabel, TagToggleGroup } from '@/components/profile/shared';

interface DislikedIngredientsFieldProps {
  values: string[];
  onChange: (values: string[]) => void;
  className?: string;
}

const commonDislikedIngredients = [
  'Mushrooms',
  'Onions',
  'Garlic',
  'Cilantro',
  'Olives',
  'Tomatoes',
  'Bell Peppers',
  'Spicy Peppers',
  'Coconut',
  'Seafood',
  'Liver',
  'Blue Cheese',
  'Anchovies',
  'Pickles',
  'Avocado',
  'Eggplant',
];

export const DislikedIngredientsField: React.FC<
  DislikedIngredientsFieldProps
> = ({ values, onChange, className = '' }) => {
  const [customInput, setCustomInput] = useState('');

  const toggleIngredient = (ingredient: string) => {
    if (values.includes(ingredient)) {
      onChange(values.filter((v) => v !== ingredient));
    } else {
      onChange([...values, ingredient]);
    }
  };

  const addCustomIngredient = () => {
    const trimmed = customInput.trim();
    if (trimmed && !values.includes(trimmed)) {
      onChange([...values, trimmed]);
      setCustomInput('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addCustomIngredient();
    }
  };

  return (
    <div className={`form-control ${className}`}>
      <FieldLabel>Disliked Ingredients</FieldLabel>

      <TagToggleGroup className="mb-3">
        {commonDislikedIngredients.map((ingredient) => (
          <button
            key={ingredient}
            type="button"
            className={`btn btn-sm ${
              values.includes(ingredient) ? 'btn-accent' : 'btn-outline'
            }`}
            onClick={() => toggleIngredient(ingredient)}
          >
            {ingredient}
          </button>
        ))}
      </TagToggleGroup>

      <div className="flex gap-2">
        <input
          type="text"
          className="input-bordered input flex-1"
          placeholder="Add disliked ingredient..."
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          onKeyPress={handleKeyPress}
        />
        <button
          type="button"
          className="btn btn-outline btn-sm"
          onClick={addCustomIngredient}
          disabled={!customInput.trim()}
        >
          Add
        </button>
      </div>

      {values.length > 0 && (
        <div className="mt-2">
          <span className="text-sm font-medium">Selected:</span>
          <div className="mt-1 flex flex-wrap gap-1">
            {values.map((ingredient) => (
              <span
                key={ingredient}
                className="badge badge-accent cursor-pointer"
                onClick={() => toggleIngredient(ingredient)}
              >
                {ingredient} ×
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
