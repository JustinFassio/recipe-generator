import React from 'react';

interface RangeWithTicksProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  className?: string;
  ticks?: string[];
}

export const RangeWithTicks: React.FC<RangeWithTicksProps> = ({
  value,
  onChange,
  min,
  max,
  step = 1,
  className = '',
  ticks,
}) => {
  return (
    <div className={`form-control ${className}`}>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="range range-primary"
      />
      {ticks && (
        <div className="flex w-full justify-between px-2 text-xs">
          {ticks.map((tick, index) => (
            <span key={index}>{tick}</span>
          ))}
        </div>
      )}
    </div>
  );
};
