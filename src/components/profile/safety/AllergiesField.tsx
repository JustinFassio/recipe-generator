import React, { useState, useCallback } from 'react';
import { FieldLabel, TagToggleGroup } from '@/components/profile/shared';
import { withTextWrapping } from '@/lib/text-wrapping-migration';

interface AllergiesFieldProps {
  values: string[];
  onChange: (values: string[]) => void;
  className?: string;
}

const commonAllergens = [
  'Peanuts',
  'Tree Nuts',
  'Milk',
  'Eggs',
  'Fish',
  'Shellfish',
  'Soy',
  'Wheat',
  'Sesame',
  'Sulfites',
];

export const AllergiesField: React.FC<AllergiesFieldProps> = React.memo(
  ({ values, onChange, className = '' }) => {
    const [customInput, setCustomInput] = useState('');

    const toggleAllergen = useCallback(
      (allergen: string) => {
        if (values.includes(allergen)) {
          onChange(values.filter((v) => v !== allergen));
        } else {
          onChange([...values, allergen]);
        }
      },
      [values, onChange]
    );

    const addCustomAllergen = useCallback(() => {
      const trimmed = customInput.trim();
      if (trimmed && !values.includes(trimmed)) {
        onChange([...values, trimmed]);
        setCustomInput('');
      }
    }, [customInput, values, onChange]);

    const handleKeyPress = useCallback(
      (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          addCustomAllergen();
        }
      },
      [addCustomAllergen]
    );

    const handleInputChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        setCustomInput(e.target.value);
      },
      []
    );

    return (
      <div className={`form-control ${className}`}>
        <FieldLabel>Allergies</FieldLabel>

        <TagToggleGroup className="mb-3">
          {commonAllergens.map((allergen) => (
            <button
              key={allergen}
              type="button"
              className={`btn btn-sm ${
                values.includes(allergen) ? 'btn-error' : 'btn-outline'
              }`}
              onClick={() => toggleAllergen(allergen)}
            >
              {allergen}
            </button>
          ))}
        </TagToggleGroup>

        <div className="flex gap-2">
          <input
            type="text"
            className="input-bordered input flex-1"
            placeholder="Add custom allergen..."
            value={customInput}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
          />
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={addCustomAllergen}
            disabled={!customInput.trim()}
          >
            Add
          </button>
        </div>

        {values.length > 0 && (
          <div className="mt-2">
            <span className="text-sm font-medium">Selected:</span>
            <div className={`mt-1 flex flex-wrap gap-1 ${withTextWrapping()}`}>
              {values.map((allergen) => (
                <span
                  key={allergen}
                  className="badge badge-error cursor-pointer"
                  onClick={() => toggleAllergen(allergen)}
                >
                  {allergen} ×
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }
);

AllergiesField.displayName = 'AllergiesField';
