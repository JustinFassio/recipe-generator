import React, { useState } from 'react';
import { FieldLabel, TagToggleGroup } from '@/components/profile/shared';
import { withTextWrapping } from '@/lib/text-wrapping-migration';
import { commonDietaryRestrictions } from '@/components/profile/constants';

interface DietaryRestrictionsFieldProps {
  values: string[];
  onChange: (values: string[]) => void;
  className?: string;
}

export const DietaryRestrictionsField: React.FC<
  DietaryRestrictionsFieldProps
> = ({ values, onChange, className = '' }) => {
  const [customInput, setCustomInput] = useState('');

  const toggleRestriction = (restriction: string) => {
    if (values.includes(restriction)) {
      onChange(values.filter((v) => v !== restriction));
    } else {
      onChange([...values, restriction]);
    }
  };

  const addCustomRestriction = () => {
    const trimmed = customInput.trim();
    if (trimmed && !values.includes(trimmed)) {
      onChange([...values, trimmed]);
      setCustomInput('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addCustomRestriction();
    }
  };

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
          onChange={(e) => setCustomInput(e.target.value)}
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
};
