import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { CategoryChipRemovable } from './category-chip';
import {
  uniqueValidCategories,
  validateCategory,
} from '@/lib/category-parsing';
import { CANONICAL_CATEGORIES } from '@/lib/categories';

export interface CategoryInputProps {
  value: string[];
  onChange: (categories: string[]) => void;
  suggestions?: string[];
  placeholder?: string;
  maxCategories?: number;
  disabled?: boolean;
  className?: string;
  error?: string;
}

export function CategoryInput({
  value = [],
  onChange,
  suggestions = CANONICAL_CATEGORIES,
  placeholder = 'Add category...',
  maxCategories = 6,
  disabled = false,
  className = '',
  error,
}: CategoryInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter suggestions based on input and current categories
  const filteredSuggestions = suggestions
    .filter(
      (suggestion) =>
        !value.includes(suggestion) &&
        suggestion.toLowerCase().includes(inputValue.toLowerCase())
    )
    .slice(0, 10); // Limit dropdown items

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setIsDropdownOpen(newValue.length > 0);
    setFocusedIndex(-1);
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: string) => {
    addCategory(suggestion);
  };

  // Add category
  const addCategory = (category: string) => {
    if (
      !category.trim() ||
      value.includes(category) ||
      value.length >= maxCategories
    ) {
      return;
    }

    if (validateCategory(category)) {
      const newCategories = uniqueValidCategories([...value, category]);
      onChange(newCategories);
      setInputValue('');
      setIsDropdownOpen(false);
      setFocusedIndex(-1);
    }
  };

  // Remove category
  const removeCategory = (categoryToRemove: string) => {
    const newCategories = value.filter((cat) => cat !== categoryToRemove);
    onChange(newCategories);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        if (focusedIndex >= 0 && filteredSuggestions[focusedIndex]) {
          handleSuggestionSelect(filteredSuggestions[focusedIndex]);
        } else if (inputValue.trim()) {
          addCategory(inputValue.trim());
        }
        break;

      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex((prev) =>
          prev < filteredSuggestions.length - 1 ? prev + 1 : 0
        );
        break;

      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredSuggestions.length - 1
        );
        break;

      case 'Escape':
        setIsDropdownOpen(false);
        setFocusedIndex(-1);
        break;

      case 'Tab':
        if (isDropdownOpen) {
          setIsDropdownOpen(false);
        }
        break;
    }
  };

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isAtMaxCategories = value.length >= maxCategories;

  return (
    <div className={`form-control ${className}`}>
      {/* Selected categories */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {value.map((category, index) => (
            <CategoryChipRemovable
              key={`${category}-${index}`}
              category={category}
              onRemove={removeCategory}
              disabled={disabled}
            />
          ))}
        </div>
      )}

      {/* Input field */}
      <div className="relative">
        <div className="input-group">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsDropdownOpen(inputValue.length > 0)}
            placeholder={
              isAtMaxCategories
                ? `Max ${maxCategories} categories`
                : placeholder
            }
            disabled={disabled || isAtMaxCategories}
            className={`input input-bordered flex-1 ${error ? 'input-error' : ''}`}
            aria-describedby={error ? 'category-error' : undefined}
          />

          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            disabled={disabled}
            className="btn btn-square btn-outline"
            aria-label="Show category suggestions"
          >
            <ChevronDown
              className={`h-4 w-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
            />
          </button>
        </div>

        {/* Dropdown suggestions */}
        {isDropdownOpen && filteredSuggestions.length > 0 && (
          <div
            ref={dropdownRef}
            className="dropdown-content absolute z-50 w-full mt-1 border border-base-300 rounded-lg max-h-60 overflow-y-auto bg-base-100 text-base-content shadow-lg"
          >
            {filteredSuggestions.map((suggestion, index) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => handleSuggestionSelect(suggestion)}
                className={`w-full px-4 py-2 text-left transition-colors hover:bg-base-200 text-base-content ${
                  index === focusedIndex ? 'bg-base-200' : ''
                }`}
                onMouseEnter={() => setFocusedIndex(index)}
              >
                <span className="text-sm">{suggestion}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="label">
          <span id="category-error" className="label-text-alt text-error">
            {error}
          </span>
        </div>
      )}

      {/* Help text */}
      <div className="label">
        <span className="label-text-alt text-base-content opacity-70">
          {value.length}/{maxCategories} categories
          {value.length > 0 && ' • Press Enter to add custom category'}
        </span>
      </div>
    </div>
  );
}
