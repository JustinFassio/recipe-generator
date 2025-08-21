import React, { useState } from 'react';
import { FieldLabel, TagToggleGroup } from '@/components/profile/shared';
import { withTextWrapping } from '@/lib/text-wrapping-migration';
import { commonEquipment } from '@/components/profile/constants';

interface EquipmentFieldProps {
  values: string[];
  onChange: (values: string[]) => void;
  className?: string;
}

export const EquipmentField: React.FC<EquipmentFieldProps> = ({
  values,
  onChange,
  className = '',
}) => {
  const [customInput, setCustomInput] = useState('');

  const toggleEquipment = (equipment: string) => {
    if (values.includes(equipment)) {
      onChange(values.filter((v) => v !== equipment));
    } else {
      onChange([...values, equipment]);
    }
  };

  const addCustomEquipment = () => {
    const trimmed = customInput.trim();
    if (trimmed && !values.includes(trimmed)) {
      onChange([...values, trimmed]);
      setCustomInput('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addCustomEquipment();
    }
  };

  return (
    <div className={`form-control ${className}`}>
      <FieldLabel>Available Equipment</FieldLabel>

      <TagToggleGroup className="mb-3">
        {commonEquipment.map((equipment) => (
          <button
            key={equipment}
            type="button"
            className={`btn btn-sm ${
              values.includes(equipment) ? 'btn-secondary' : 'btn-outline'
            }`}
            onClick={() => toggleEquipment(equipment)}
          >
            {equipment}
          </button>
        ))}
      </TagToggleGroup>

      <div className="flex gap-2">
        <input
          type="text"
          className="input-bordered input flex-1"
          placeholder="Add custom equipment..."
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          onKeyPress={handleKeyPress}
        />
        <button
          type="button"
          className="btn btn-outline btn-sm"
          onClick={addCustomEquipment}
          disabled={!customInput.trim()}
        >
          Add
        </button>
      </div>

      {values.length > 0 && (
        <div className="mt-2">
          <span className="text-sm font-medium">Selected:</span>
          <div className={`mt-1 flex flex-wrap gap-1 ${withTextWrapping()}`}>
            {values.map((equipment) => (
              <span
                key={equipment}
                className="badge badge-secondary cursor-pointer"
                onClick={() => toggleEquipment(equipment)}
              >
                {equipment} ×
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
