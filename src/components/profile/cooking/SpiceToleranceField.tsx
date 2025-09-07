import React from 'react';
import { FieldLabel, ValueSlider } from '@/components/profile/shared';

interface SpiceToleranceFieldProps {
  value: number;
  onChange: (value: number) => void;
  className?: string;
}

const spiceLabels = ['Mild', 'Medium', 'Hot', 'Very Hot', 'Extreme'];

export const SpiceToleranceField: React.FC<SpiceToleranceFieldProps> = ({
  value,
  onChange,
  className = '',
}) => {
  return (
    <div className={`form-control ${className}`}>
      <FieldLabel>Spice Tolerance:</FieldLabel>
      <ValueSlider
        value={value}
        onChange={onChange}
        min={1}
        max={5}
        valueFormatter={(value) => spiceLabels[value - 1]}
        className="w-full"
      />
    </div>
  );
};
