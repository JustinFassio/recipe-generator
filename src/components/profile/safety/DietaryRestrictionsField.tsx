import React, { useState, useCallback } from 'react';
import { FieldLabel, TagToggleGroup } from '@/components/profile/shared';
import { withTextWrapping } from '@/lib/text-wrapping-migration';

interface DietaryRestrictionsFieldProps {
  values: string[];
  onChange: (values: string[]) => void;
  className?: string;
}

const commonDietaryRestrictions = [
  'Vegetarian',
  'Vegan',
  'Pescatarian',
  'Keto',
  'Paleo',
  'Low Carb',
  'Low Fat',
  'Low Sodium',
  'Gluten-Free',
  'Dairy-Free',
  'Halal',
  'Kosher',
];

export const DietaryRestrictionsField: React.FC<DietaryRestrictionsFieldProps> =
  React.memo(({ values, onChange, className = '' }) => {
    const [customInput, setCustomInput] = useState('');

    const toggleRestriction = useCallback(
      (restriction: string) => {
        if (values.includes(restriction)) {
          onChange(values.filter((v) => v !== restriction));
        } else {
          onChange([...values, restriction]);
        }
      },
      [values, onChange]
    );

    const addCustomRestriction = useCallback(() => {
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
          addCustomRestriction();
        }
      },
      [addCustomRestriction]
    );

    const handleInputChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        setCustomInput(e.target.value);
      },
      []
    );

    return (
      <div className={`form-control ${className}`}>
        <FieldLabel>Dietary Restrictions</FieldLabel>

        <TagToggleGroup className="mb-3">
          {commonDietaryRestrictions.map((restriction) => (
            <button
              key={restriction}
              type="button"
              className={`btn btn-sm ${
                values.includes(restriction) ? 'btn-info' : 'btn-outline'
              }`}
              onClick={() => toggleRestriction(restriction)}
            >
              {restriction}
            </button>
          ))}
        </TagToggleGroup>

        <div className="flex gap-2">
          <input
            type="text"
            className="input-bordered input flex-1"
            placeholder="Add custom restriction..."
            value={customInput}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
          />
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={addCustomRestriction}
            disabled={!customInput.trim()}
          >
            Add
          </button>
        </div>

        {values.length > 0 && (
          <div className="mt-2">
            <span className="text-sm font-medium">Selected:</span>
            <div className={`mt-1 flex flex-wrap gap-1 ${withTextWrapping()}`}>
              {values.map((restriction) => (
                <span
                  key={restriction}
                  className="badge badge-info cursor-pointer"
                  onClick={() => toggleRestriction(restriction)}
                >
                  {restriction} ×
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  });

DietaryRestrictionsField.displayName = 'DietaryRestrictionsField';
