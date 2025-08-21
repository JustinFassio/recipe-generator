import React, { useState } from 'react';
import { FieldLabel, TagToggleGroup } from '@/components/profile/shared';
import { withTextWrapping } from '@/lib/text-wrapping-migration';
import { commonCuisines } from '@/components/profile/constants';

interface PreferredCuisinesFieldProps {
  values: string[];
  onChange: (values: string[]) => void;
  className?: string;
}

export const PreferredCuisinesField: React.FC<PreferredCuisinesFieldProps> = ({
  values,
  onChange,
  className = '',
}) => {
  const [customInput, setCustomInput] = useState('');

  const toggleCuisine = (cuisine: string) => {
    if (values.includes(cuisine)) {
      onChange(values.filter((v) => v !== cuisine));
    } else {
      onChange([...values, cuisine]);
    }
  };

  const addCustomCuisine = () => {
    const trimmed = customInput.trim();
    if (trimmed && !values.includes(trimmed)) {
      onChange([...values, trimmed]);
      setCustomInput('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addCustomCuisine();
    }
  };

  return (
    <div className={`form-control ${className}`}>
      <FieldLabel>Preferred Cuisines</FieldLabel>

      <TagToggleGroup className="mb-3">
        {commonCuisines.map((cuisine) => (
          <button
            key={cuisine}
            type="button"
            className={`btn btn-sm ${
              values.includes(cuisine) ? 'btn-primary' : 'btn-outline'
            }`}
            onClick={() => toggleCuisine(cuisine)}
          >
            {cuisine}
          </button>
        ))}
      </TagToggleGroup>

      <div className="flex gap-2">
        <input
          type="text"
          className="input-bordered input flex-1"
          placeholder="Add custom cuisine..."
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          onKeyPress={handleKeyPress}
        />
        <button
          type="button"
          className="btn btn-outline btn-sm"
          onClick={addCustomCuisine}
          disabled={!customInput.trim()}
        >
          Add
        </button>
      </div>

      {values.length > 0 && (
        <div className="mt-2">
          <span className="text-sm font-medium">Selected:</span>
          <div className={`mt-1 flex flex-wrap gap-1 ${withTextWrapping()}`}>
            {values.map((cuisine) => (
              <span
                key={cuisine}
                className="badge badge-primary cursor-pointer"
                onClick={() => toggleCuisine(cuisine)}
              >
                {cuisine} ×
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
