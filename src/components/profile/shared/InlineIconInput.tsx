import React from 'react';
import { LucideIcon } from 'lucide-react';

interface InlineIconInputProps {
  icon: LucideIcon;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  className?: string;
  disabled?: boolean;
  pattern?: string;
  minLength?: number;
  maxLength?: number;
}

export const InlineIconInput: React.FC<InlineIconInputProps> = ({
  icon: Icon,
  value,
  onChange,
  placeholder = '',
  type = 'text',
  className = '',
  disabled = false,
  pattern,
  minLength,
  maxLength,
}) => {
  return (
    <div className="relative">
      <Icon className="text-base-content/40 absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform" />
      <input
        type={type}
        className={`input-bordered input w-full pl-10 ${className}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        pattern={pattern}
        minLength={minLength}
        maxLength={maxLength}
      />
    </div>
  );
};
