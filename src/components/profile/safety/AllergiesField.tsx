import React, { useState } from 'react';
import { FieldLabel, TagToggleGroup } from '@/components/profile/shared';
import { withTextWrapping } from '@/lib/text-wrapping-migration';
import { commonAllergens } from '@/components/profile/constants';

interface AllergiesFieldProps {
  values: string[];
  onChange: (values: string[]) => void;
  className?: string;
}

export const AllergiesField: React.FC<AllergiesFieldProps> = ({
  values,
  onChange,
  className = '',
}) => {
  const [customInput, setCustomInput] = useState('');

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
          onChange={(e) => setCustomInput(e.target.value)}
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
};
