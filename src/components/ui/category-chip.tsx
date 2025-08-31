import React from 'react';
import { X } from 'lucide-react';
import { parseCategory } from '@/lib/category-parsing';

export interface CategoryChipProps {
  category: string;
  variant?: 'default' | 'clickable' | 'selected' | 'removable';
  size?: 'sm' | 'md' | 'lg';
  onClick?: (category: string) => void;
  onRemove?: (category: string) => void;
  className?: string;
  disabled?: boolean;
}

export function CategoryChip({
  category,
  variant = 'default',
  size = 'md',
  onClick,
  onRemove,
  className = '',
  disabled = false,
}: CategoryChipProps) {
  const { namespace, value } = parseCategory(category);

  // DaisyUI-based styling
  const baseClasses =
    'badge inline-flex items-center gap-1 transition-all duration-200';

  const variantClasses = {
    default: 'badge-neutral',
    clickable: 'badge-outline hover:badge-primary cursor-pointer',
    selected: 'badge-primary',
    removable: 'badge-secondary',
  };

  const sizeClasses = {
    sm: 'badge-sm text-xs',
    md: 'badge-md text-sm',
    lg: 'badge-lg text-base',
  };

  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : '';

  const chipClasses = `
    ${baseClasses}
    ${variantClasses[variant]}
    ${sizeClasses[size]}
    ${disabledClasses}
    ${className}
  `.trim();

  const handleClick = () => {
    if (!disabled && onClick) {
      onClick(category);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!disabled && onRemove) {
      onRemove(category);
    }
  };

  return (
    <span
      className={chipClasses}
      onClick={handleClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick && !disabled ? 0 : undefined}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && onClick && !disabled) {
          e.preventDefault();
          handleClick();
        }
      }}
      aria-label={`Category: ${category}`}
    >
      {namespace && (
        <span className="font-medium opacity-75">{namespace}:</span>
      )}
      <span>{value}</span>

      {onRemove && (
        <button
          type="button"
          onClick={handleRemove}
          className="ml-1 hover:bg-black hover:bg-opacity-20 rounded-full p-0.5 transition-colors"
          aria-label={`Remove ${category}`}
          tabIndex={-1}
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </span>
  );
}

// Specialized chip variants for common use cases
export function CategoryChipClickable(
  props: Omit<CategoryChipProps, 'variant'>
) {
  return <CategoryChip {...props} variant="clickable" />;
}

export function CategoryChipSelected(
  props: Omit<CategoryChipProps, 'variant'>
) {
  return <CategoryChip {...props} variant="selected" />;
}

export function CategoryChipRemovable(
  props: Omit<CategoryChipProps, 'variant'>
) {
  return <CategoryChip {...props} variant="removable" />;
}
