import React, { useState, useRef } from 'react';

import CategoryChip from './CategoryChip';
import {
  MAX_CATEGORIES_PER_RECIPE,
  MAX_CATEGORY_LENGTH,
} from '@/lib/constants';
import { useToast } from '@/hooks/use-toast';

interface CategoryInputProps {
  categories: string[];
  onCategoriesChange: (categories: string[]) => void;
  maxCategories?: number;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const CategoryInput: React.FC<CategoryInputProps> = ({
  categories = [],
  onCategoriesChange,
  maxCategories = MAX_CATEGORIES_PER_RECIPE,
  placeholder = 'Add a category...',
  className = '',
  disabled = false,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleAddCategory = (category: string) => {
    const trimmedCategory = category.trim();

    if (!trimmedCategory) return;

    // Validate category length
    if (trimmedCategory.length > MAX_CATEGORY_LENGTH) {
      toast({
        title: 'Category too long',
        description: `Category must be ${MAX_CATEGORY_LENGTH} characters or less`,
        variant: 'destructive',
      });
      return;
    }

    // Check if category already exists (case-insensitive)
    const exists = categories.some(
      (cat) => cat.toLowerCase() === trimmedCategory.toLowerCase()
    );

    if (exists) {
      toast({
        title: 'Category already exists',
        description: 'This category has already been added',
        variant: 'destructive',
      });
      return;
    }

    // Check max categories limit
    if (categories.length >= maxCategories) {
      toast({
        title: 'Maximum categories reached',
        description: `Maximum ${maxCategories} categories allowed`,
        variant: 'destructive',
      });
      return;
    }

    const newCategories = [...categories, trimmedCategory];
    onCategoriesChange(newCategories);
    setInputValue('');
  };

  const handleRemoveCategory = (categoryToRemove: string) => {
    const newCategories = categories.filter((cat) => cat !== categoryToRemove);
    onCategoriesChange(newCategories);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddCategory(inputValue);
    } else if (
      e.key === 'Backspace' &&
      inputValue === '' &&
      categories.length > 0
    ) {
      // Remove last category on backspace when input is empty
      const lastCategory = categories[categories.length - 1];
      handleRemoveCategory(lastCategory);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    // Add category on blur if there's input
    if (inputValue.trim()) {
      handleAddCategory(inputValue);
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div
        className={`min-h-[44px] rounded-lg border p-2 transition-colors ${
          isFocused
            ? 'border-primary ring-primary/20 ring-2'
            : 'border-gray-300 hover:border-gray-400'
        } ${disabled ? 'cursor-not-allowed bg-gray-50' : 'bg-white'}`}
        onClick={() => !disabled && inputRef.current?.focus()}
      >
        <div className="flex flex-wrap items-center gap-2">
          {categories.map((category, index) => (
            <CategoryChip
              key={`${category}-${index}`}
              category={category}
              onRemove={handleRemoveCategory}
              variant="removable"
              size="sm"
            />
          ))}

          {categories.length < maxCategories && !disabled && (
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={handleBlur}
              placeholder={categories.length === 0 ? placeholder : ''}
              className="min-w-[120px] flex-1 bg-transparent text-sm placeholder-gray-400 outline-none"
              maxLength={50}
            />
          )}
        </div>
      </div>

      {categories.length > 0 && (
        <div className="text-xs text-gray-500">
          {categories.length} of {maxCategories} categories
        </div>
      )}
    </div>
  );
};

export default CategoryInput;
