import React, { useState } from 'react';
import { FieldLabel, TagToggleGroup } from '@/components/profile/shared';

interface MedicalConditionsFieldProps {
  values: string[];
  onChange: (values: string[]) => void;
  className?: string;
}

const commonMedicalConditions = [
  'Diabetes',
  'High Blood Pressure',
  'Heart Disease',
  'Kidney Disease',
  'Liver Disease',
  'Celiac Disease',
  'IBS',
  'GERD',
];

export const MedicalConditionsField: React.FC<MedicalConditionsFieldProps> = ({
  values,
  onChange,
  className = '',
}) => {
  const [customInput, setCustomInput] = useState('');

  const toggleCondition = (condition: string) => {
    if (values.includes(condition)) {
      onChange(values.filter((v) => v !== condition));
    } else {
      onChange([...values, condition]);
    }
  };

  const addCustomCondition = () => {
    const trimmed = customInput.trim();
    if (trimmed && !values.includes(trimmed)) {
      onChange([...values, trimmed]);
      setCustomInput('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addCustomCondition();
    }
  };

  return (
    <div className={`form-control ${className}`}>
      <FieldLabel>Medical Conditions</FieldLabel>

      <TagToggleGroup className="mb-3">
        {commonMedicalConditions.map((condition) => (
          <button
            key={condition}
            type="button"
            className={`btn btn-sm ${
              values.includes(condition) ? 'btn-warning' : 'btn-outline'
            }`}
            onClick={() => toggleCondition(condition)}
          >
            {condition}
          </button>
        ))}
      </TagToggleGroup>

      <div className="flex gap-2">
        <input
          type="text"
          className="input-bordered input flex-1"
          placeholder="Add custom condition..."
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          onKeyPress={handleKeyPress}
        />
        <button
          type="button"
          className="btn btn-outline btn-sm"
          onClick={addCustomCondition}
          disabled={!customInput.trim()}
        >
          Add
        </button>
      </div>

      {values.length > 0 && (
        <div className="mt-2">
          <span className="text-sm font-medium">Selected:</span>
          <div className="mt-1 flex flex-wrap gap-1">
            {values.map((condition) => (
              <span
                key={condition}
                className="badge badge-warning cursor-pointer"
                onClick={() => toggleCondition(condition)}
              >
                {condition} ×
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
