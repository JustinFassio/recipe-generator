import React from 'react';
import { FieldLabel, RangeWithTicks } from '@/components/profile/shared';
import { spiceLabels } from '@/components/profile/constants';

interface SpiceToleranceFieldProps {
  value: number;
  onChange: (value: number) => void;
  className?: string;
}

export const SpiceToleranceField: React.FC<SpiceToleranceFieldProps> = ({
  value,
  onChange,
  className = '',
}) => {
  return (
    <div className={`form-control ${className}`}>
      <FieldLabel>Spice Tolerance: {spiceLabels[value - 1]}</FieldLabel>
      <RangeWithTicks
        value={value}
        onChange={onChange}
        min={1}
        max={5}
        ticks={spiceLabels}
      />
    </div>
  );
};
