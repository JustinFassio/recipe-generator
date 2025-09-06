import React from 'react';

interface ValueSliderProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  className?: string;
  label?: string;
  valueFormatter?: (value: number) => string;
}

export const ValueSlider: React.FC<ValueSliderProps> = ({
  value,
  onChange,
  min,
  max,
  step = 1,
  className = '',
  label,
  valueFormatter = (val) => val.toString(),
}) => {
  return (
    <div className={`w-full ${className}`}>
      {/* Value display above slider */}
      <div className="text-center mb-2">
        <span className="text-lg font-medium text-base-content">
          {valueFormatter(value)}
        </span>
      </div>

      {/* Slider track */}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="range range-primary w-full"
      />

      {/* Optional label below slider */}
      {label && (
        <div className="text-center mt-2">
          <span className="text-sm text-base-content/60">{label}</span>
        </div>
      )}
    </div>
  );
};
