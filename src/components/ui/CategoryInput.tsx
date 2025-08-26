import React, { useState, useRef } from 'react';

import CategoryChip from './CategoryChip';

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
  maxCategories = 10,
  placeholder = 'Add a category...',
  className = '',
  disabled = false,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleAddCategory = (category: string) => {
    const trimmedCategory = category.trim();
    
    if (!trimmedCategory) return;
    
    // Validate category length
    if (trimmedCategory.length > 50) {
      alert('Category must be 50 characters or less');
      return;
    }
    
    // Check if category already exists (case-insensitive)
    const exists = categories.some(cat => 
      cat.toLowerCase() === trimmedCategory.toLowerCase()
    );
    
    if (exists) {
      alert('This category already exists');
      return;
    }
    
    // Check max categories limit
    if (categories.length >= maxCategories) {
      alert(`Maximum ${maxCategories} categories allowed`);
      return;
    }
    
    const newCategories = [...categories, trimmedCategory];
    onCategoriesChange(newCategories);
    setInputValue('');
  };

  const handleRemoveCategory = (categoryToRemove: string) => {
    const newCategories = categories.filter(cat => cat !== categoryToRemove);
    onCategoriesChange(newCategories);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddCategory(inputValue);
    } else if (e.key === 'Backspace' && inputValue === '' && categories.length > 0) {
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
        className={`min-h-[44px] p-2 border rounded-lg transition-colors ${
          isFocused 
            ? 'border-primary ring-2 ring-primary/20' 
            : 'border-gray-300 hover:border-gray-400'
        } ${disabled ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'}`}
        onClick={() => !disabled && inputRef.current?.focus()}
      >
        <div className="flex flex-wrap gap-2 items-center">
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
              className="flex-1 min-w-[120px] bg-transparent outline-none text-sm placeholder-gray-400"
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
