import React from 'react';

interface RangeWithTicksProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  className?: string;
  ticks?: string[];
  id?: string;
  'aria-label'?: string;
  'aria-describedby'?: string;
  'aria-valuetext'?: string;
}

export const RangeWithTicks: React.FC<RangeWithTicksProps> = ({
  value,
  onChange,
  min,
  max,
  step = 1,
  className = '',
  ticks,
  id,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedby,
  'aria-valuetext': ariaValuetext,
}) => {
  // Calculate current value text from ticks if available
  const currentValueText =
    ticks && ticks[value - 1] ? ticks[value - 1] : value.toString();
  return (
    <div className={`form-control ${className}`}>
      <input
        type="range"
        id={id}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="range range-primary"
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedby}
        aria-valuetext={ariaValuetext || currentValueText}
        aria-valuenow={value}
        aria-valuemin={min}
        aria-valuemax={max}
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
};
