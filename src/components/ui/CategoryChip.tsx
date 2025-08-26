import React from 'react';
import { X } from 'lucide-react';

interface CategoryChipProps {
  category: string;
  onRemove?: (category: string) => void;
  variant?: 'default' | 'removable' | 'readonly';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const CategoryChip: React.FC<CategoryChipProps> = ({
  category,
  onRemove,
  variant = 'default',
  size = 'md',
  className = '',
}) => {
  const baseClasses =
    'inline-flex items-center gap-1 rounded-full font-medium transition-colors';

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  const variantClasses = {
    default:
      'bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20',
    removable:
      'bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 pr-2',
    readonly: 'bg-gray-100 text-gray-700 border border-gray-200',
  };

  const classes = `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`;

  const handleRemove = () => {
    if (onRemove && variant === 'removable') {
      onRemove(category);
    }
  };

  return (
    <span className={classes}>
      <span className="max-w-[120px] truncate">{category}</span>
      {variant === 'removable' && onRemove && (
        <button
          type="button"
          onClick={handleRemove}
          className="hover:bg-primary/20 ml-1 rounded-full p-0.5 transition-colors"
          aria-label={`Remove ${category} category`}
        >
          <X size={12} />
        </button>
      )}
    </span>
  );
};

export default CategoryChip;
