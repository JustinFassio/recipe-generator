import React, { useCallback } from 'react';

interface RangeWithTicksProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  className?: string;
  ticks?: readonly string[];
}

export const RangeWithTicks: React.FC<RangeWithTicksProps> = React.memo(
  ({ value, onChange, min, max, step = 1, className = '', ticks }) => {
    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(Number(e.target.value));
      },
      [onChange]
    );

    return (
      <div className={`form-control ${className}`}>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleChange}
          className="range range-primary"
        />
        {ticks && (
          <div
            className="flex w-full justify-between px-2 text-xs"
            role="group"
            aria-label="Range value indicators"
          >
            {ticks.map((tick, index) => (
              <span
                key={index}
                aria-label={`${tick} (position ${index + 1} of ${ticks.length})`}
              >
                {tick}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  }
);

RangeWithTicks.displayName = 'RangeWithTicks';
