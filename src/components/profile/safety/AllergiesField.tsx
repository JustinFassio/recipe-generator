import React, { useState, useId } from 'react';
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

export const AllergiesField: React.FC<AllergiesFieldProps> = ({
  values,
  onChange,
  className = '',
}) => {
  const [customInput, setCustomInput] = useState('');
  const fieldId = useId();
  const inputId = `${fieldId}-input`;
  // const groupId = `${fieldId}-group`; // Reserved for future use
  const selectedId = `${fieldId}-selected`;
  const helpId = `${fieldId}-help`;

  const toggleAllergen = (allergen: string) => {
    if (values.includes(allergen)) {
      onChange(values.filter((v) => v !== allergen));
    } else {
      onChange([...values, allergen]);
    }
  };

  const addCustomAllergen = () => {
    const trimmed = customInput.trim();
    if (trimmed && !values.includes(trimmed)) {
      onChange([...values, trimmed]);
      setCustomInput('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addCustomAllergen();
    }
  };

  return (
    <div className={`form-control ${className}`}>
      <FieldLabel htmlFor={inputId}>Allergies</FieldLabel>

      <div id={helpId} className="text-base-content/70 mb-2 text-sm">
        Select your allergies from the common options below or add custom ones.
      </div>

      <TagToggleGroup
        className="mb-3"
        aria-label="Common allergens"
        aria-describedby={helpId}
      >
        {commonAllergens.map((allergen) => (
          <button
            key={allergen}
            type="button"
            className={`btn btn-sm ${
              values.includes(allergen) ? 'btn-error' : 'btn-outline'
            }`}
            onClick={() => toggleAllergen(allergen)}
            aria-pressed={values.includes(allergen)}
            aria-describedby={
              values.includes(allergen) ? selectedId : undefined
            }
          >
            {allergen}
          </button>
        ))}
      </TagToggleGroup>

      <div className="flex gap-2">
        <input
          id={inputId}
          type="text"
          className="input-bordered input flex-1"
          placeholder="Add custom allergen..."
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          onKeyPress={handleKeyPress}
          aria-label="Add custom allergen"
          aria-describedby={helpId}
        />
        <button
          type="button"
          className="btn btn-outline btn-sm"
          onClick={addCustomAllergen}
          disabled={!customInput.trim()}
          aria-label={`Add ${customInput.trim() || 'custom allergen'}`}
        >
          Add
        </button>
      </div>

      {values.length > 0 && (
        <div className="mt-2">
          <span className="text-sm font-medium" id={selectedId}>
            Selected allergies ({values.length}):
          </span>
          <div
            className={`mt-1 flex flex-wrap gap-1 ${withTextWrapping()}`}
            role="list"
            aria-label="Selected allergies"
          >
            {values.map((allergen) => (
              <button
                key={allergen}
                type="button"
                className="hover:badge-error/80 badge badge-error cursor-pointer focus:outline-none focus:ring-2 focus:ring-error focus:ring-offset-2"
                onClick={() => toggleAllergen(allergen)}
                aria-label={`Remove ${allergen} from allergies`}
                role="listitem"
              >
                {allergen} ×
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
