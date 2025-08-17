# Phase 4: UI Components

**Atomic category components and visual design system**

---

## 🎯 **Phase Objectives**

Build atomic, reusable UI components for displaying and interacting with recipe categories, following our DaisyUI design system and atomic component architecture.

## 📋 **Deliverables**

- [x] Category chip component
- [x] Category display component
- [x] Category input component
- [x] Category filter component
- [x] Visual design system integration
- [x] Accessibility compliance

## 🎨 **Atomic Component Design**

### **1. Base Category Chip Component**

**File**: `src/components/ui/category-chip.tsx`

```typescript
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
  disabled = false
}: CategoryChipProps) {
  const { namespace, value } = parseCategory(category);

  // DaisyUI-based styling
  const baseClasses = 'badge inline-flex items-center gap-1 transition-all duration-200';

  const variantClasses = {
    default: 'badge-neutral',
    clickable: 'badge-outline hover:badge-primary cursor-pointer',
    selected: 'badge-primary',
    removable: 'badge-secondary'
  };

  const sizeClasses = {
    sm: 'badge-sm text-xs',
    md: 'badge-md text-sm',
    lg: 'badge-lg text-base'
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
        <span className="font-medium opacity-75">
          {namespace}:
        </span>
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
export function CategoryChipClickable(props: Omit<CategoryChipProps, 'variant'>) {
  return <CategoryChip {...props} variant="clickable" />;
}

export function CategoryChipSelected(props: Omit<CategoryChipProps, 'variant'>) {
  return <CategoryChip {...props} variant="selected" />;
}

export function CategoryChipRemovable(props: Omit<CategoryChipProps, 'variant'>) {
  return <CategoryChip {...props} variant="removable" />;
}
```

### **2. Category Display Component**

**File**: `src/components/recipes/category-display.tsx`

```typescript
import React from 'react';
import { CategoryChip } from '@/components/ui/category-chip';
import { sortCategories } from '@/lib/category-parsing';

export interface CategoryDisplayProps {
  categories: string[];
  title?: string;
  variant?: 'default' | 'clickable' | 'compact';
  maxVisible?: number;
  onCategoryClick?: (category: string) => void;
  className?: string;
  showEmpty?: boolean;
  emptyText?: string;
}

export function CategoryDisplay({
  categories,
  title = 'Categories',
  variant = 'default',
  maxVisible,
  onCategoryClick,
  className = '',
  showEmpty = false,
  emptyText = 'No categories'
}: CategoryDisplayProps) {
  // Sort categories for consistent display
  const sortedCategories = sortCategories(categories);

  // Handle max visible limit
  const visibleCategories = maxVisible
    ? sortedCategories.slice(0, maxVisible)
    : sortedCategories;

  const hiddenCount = maxVisible && sortedCategories.length > maxVisible
    ? sortedCategories.length - maxVisible
    : 0;

  // Don't render if no categories and showEmpty is false
  if (!showEmpty && (!categories || categories.length === 0)) {
    return null;
  }

  const containerClasses = {
    default: 'space-y-2',
    clickable: 'space-y-2',
    compact: 'space-y-1'
  };

  const chipGap = {
    default: 'gap-2',
    clickable: 'gap-2',
    compact: 'gap-1'
  };

  return (
    <div className={`${containerClasses[variant]} ${className}`}>
      {title && (
        <h4 className="text-sm font-medium text-base-content opacity-70">
          {title}
        </h4>
      )}

      {categories.length === 0 ? (
        <p className="text-sm text-base-content opacity-50 italic">
          {emptyText}
        </p>
      ) : (
        <div className={`flex flex-wrap ${chipGap[variant]}`}>
          {visibleCategories.map((category, index) => (
            <CategoryChip
              key={`${category}-${index}`}
              category={category}
              variant={onCategoryClick ? 'clickable' : 'default'}
              onClick={onCategoryClick}
              size={variant === 'compact' ? 'sm' : 'md'}
            />
          ))}

          {hiddenCount > 0 && (
            <span className="badge badge-outline badge-sm">
              +{hiddenCount} more
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// Specialized display variants
export function CategoryDisplayCompact(props: Omit<CategoryDisplayProps, 'variant'>) {
  return <CategoryDisplay {...props} variant="compact" />;
}

export function CategoryDisplayClickable(props: Omit<CategoryDisplayProps, 'variant'>) {
  return <CategoryDisplay {...props} variant="clickable" />;
}
```

### **3. Category Input Component**

**File**: `src/components/ui/category-input.tsx`

```typescript
import React, { useState, useRef, useEffect } from 'react';
import { Plus, ChevronDown } from 'lucide-react';
import { CategoryChipRemovable } from './category-chip';
import { uniqueValidCategories, validateCategory } from '@/lib/category-parsing';
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
  error
}: CategoryInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter suggestions based on input and current categories
  const filteredSuggestions = suggestions
    .filter(suggestion =>
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
    if (!category.trim() || value.includes(category) || value.length >= maxCategories) {
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
    const newCategories = value.filter(cat => cat !== categoryToRemove);
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
        setFocusedIndex(prev =>
          prev < filteredSuggestions.length - 1 ? prev + 1 : 0
        );
        break;

      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(prev =>
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
            placeholder={isAtMaxCategories ? `Max ${maxCategories} categories` : placeholder}
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
            <ChevronDown className={`h-4 w-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Dropdown suggestions */}
        {isDropdownOpen && filteredSuggestions.length > 0 && (
          <div
            ref={dropdownRef}
            className="absolute z-50 w-full mt-1 bg-base-100 border border-base-300 rounded-lg shadow-lg max-h-60 overflow-y-auto"
          >
            {filteredSuggestions.map((suggestion, index) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => handleSuggestionSelect(suggestion)}
                className={`w-full px-4 py-2 text-left hover:bg-base-200 transition-colors ${
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
```

### **4. Category Filter Component**

**File**: `src/components/ui/category-filter.tsx`

```typescript
import React, { useState } from 'react';
import { Filter, X } from 'lucide-react';
import { CategoryChip } from './category-chip';
import { parseCategory } from '@/lib/category-parsing';
import { CANONICAL_CATEGORIES } from '@/lib/categories';

export interface CategoryFilterProps {
  selectedCategories: string[];
  onCategoriesChange: (categories: string[]) => void;
  availableCategories?: string[];
  placeholder?: string;
  className?: string;
}

export function CategoryFilter({
  selectedCategories,
  onCategoriesChange,
  availableCategories = CANONICAL_CATEGORIES,
  placeholder = 'Filter by category...',
  className = ''
}: CategoryFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Group categories by namespace for better organization
  const groupedCategories = availableCategories.reduce((groups, category) => {
    const { namespace, value } = parseCategory(category);
    const groupKey = namespace || 'Other';

    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(category);

    return groups;
  }, {} as Record<string, string[]>);

  // Filter categories based on search term
  const filteredGroups = Object.entries(groupedCategories).reduce((filtered, [namespace, categories]) => {
    const matchingCategories = categories.filter(category =>
      category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (matchingCategories.length > 0) {
      filtered[namespace] = matchingCategories;
    }

    return filtered;
  }, {} as Record<string, string[]>);

  const toggleCategory = (category: string) => {
    if (selectedCategories.includes(category)) {
      onCategoriesChange(selectedCategories.filter(c => c !== category));
    } else {
      onCategoriesChange([...selectedCategories, category]);
    }
  };

  const clearAllFilters = () => {
    onCategoriesChange([]);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Filter button */}
      <div className="dropdown dropdown-end">
        <label
          tabIndex={0}
          className="btn btn-outline btn-sm gap-2"
          onClick={() => setIsOpen(!isOpen)}
        >
          <Filter className="h-4 w-4" />
          Categories
          {selectedCategories.length > 0 && (
            <span className="badge badge-primary badge-sm">
              {selectedCategories.length}
            </span>
          )}
        </label>

        {/* Dropdown content */}
        {isOpen && (
          <div
            tabIndex={0}
            className="dropdown-content z-50 card card-compact w-80 p-4 shadow-lg bg-base-100 border border-base-300"
          >
            <div className="card-body p-0 space-y-4">
              {/* Search input */}
              <div className="form-control">
                <input
                  type="text"
                  placeholder={placeholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input input-bordered input-sm"
                />
              </div>

              {/* Selected categories */}
              {selectedCategories.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Selected</span>
                    <button
                      type="button"
                      onClick={clearAllFilters}
                      className="btn btn-ghost btn-xs gap-1"
                    >
                      <X className="h-3 w-3" />
                      Clear all
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {selectedCategories.map((category, index) => (
                      <CategoryChip
                        key={`selected-${category}-${index}`}
                        category={category}
                        variant="selected"
                        size="sm"
                        onClick={() => toggleCategory(category)}
                        onRemove={() => toggleCategory(category)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Available categories grouped by namespace */}
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {Object.entries(filteredGroups).map(([namespace, categories]) => (
                  <div key={namespace} className="space-y-2">
                    <h4 className="text-xs font-semibold text-base-content opacity-70 uppercase tracking-wide">
                      {namespace}
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {categories.map((category, index) => (
                        <CategoryChip
                          key={`${namespace}-${category}-${index}`}
                          category={category}
                          variant={selectedCategories.includes(category) ? 'selected' : 'clickable'}
                          size="sm"
                          onClick={() => toggleCategory(category)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {Object.keys(filteredGroups).length === 0 && (
                <div className="text-center py-4">
                  <p className="text-sm text-base-content opacity-50">
                    No categories found
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Click outside handler */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}
    </div>
  );
}
```

### **5. Category Statistics Component**

**File**: `src/components/ui/category-stats.tsx`

```typescript
import React from 'react';
import { BarChart3, TrendingUp } from 'lucide-react';
import { CategoryChip } from './category-chip';

export interface CategoryStats {
  category: string;
  count: number;
  percentage: number;
}

export interface CategoryStatsProps {
  stats: CategoryStats[];
  title?: string;
  maxVisible?: number;
  onCategoryClick?: (category: string) => void;
  className?: string;
}

export function CategoryStatsDisplay({
  stats,
  title = 'Category Statistics',
  maxVisible = 10,
  onCategoryClick,
  className = ''
}: CategoryStatsProps) {
  const sortedStats = stats
    .sort((a, b) => b.count - a.count)
    .slice(0, maxVisible);

  const maxCount = Math.max(...sortedStats.map(s => s.count));

  return (
    <div className={`card bg-base-100 shadow-sm ${className}`}>
      <div className="card-body">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h3 className="card-title text-lg">{title}</h3>
        </div>

        <div className="space-y-3">
          {sortedStats.map((stat, index) => (
            <div key={`${stat.category}-${index}`} className="space-y-2">
              <div className="flex items-center justify-between">
                <CategoryChip
                  category={stat.category}
                  variant={onCategoryClick ? 'clickable' : 'default'}
                  size="sm"
                  onClick={onCategoryClick}
                />
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-medium">{stat.count}</span>
                  <span className="text-base-content opacity-60">
                    ({stat.percentage.toFixed(1)}%)
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-base-200 rounded-full h-1.5">
                <div
                  className="bg-primary h-1.5 rounded-full transition-all duration-300"
                  style={{
                    width: `${(stat.count / maxCount) * 100}%`
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {stats.length === 0 && (
          <div className="text-center py-8">
            <TrendingUp className="h-12 w-12 text-base-content opacity-30 mx-auto mb-2" />
            <p className="text-base-content opacity-60">No category data available</p>
          </div>
        )}
      </div>
    </div>
  );
}
```

## 🧪 **Component Testing**

### **1. Category Chip Tests**

**File**: `src/__tests__/components/ui/category-chip.test.tsx`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CategoryChip } from '@/components/ui/category-chip';

describe('CategoryChip', () => {
  it('should render category with namespace and value', () => {
    render(<CategoryChip category="Course: Main" />);

    expect(screen.getByText('Course:')).toBeInTheDocument();
    expect(screen.getByText('Main')).toBeInTheDocument();
  });

  it('should render simple category without namespace', () => {
    render(<CategoryChip category="Vegetarian" />);

    expect(screen.getByText('Vegetarian')).toBeInTheDocument();
    expect(screen.queryByText(':')).not.toBeInTheDocument();
  });

  it('should handle click events', () => {
    const handleClick = vi.fn();
    render(
      <CategoryChip
        category="Course: Main"
        variant="clickable"
        onClick={handleClick}
      />
    );

    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledWith('Course: Main');
  });

  it('should handle remove events', () => {
    const handleRemove = vi.fn();
    render(
      <CategoryChip
        category="Course: Main"
        variant="removable"
        onRemove={handleRemove}
      />
    );

    const removeButton = screen.getByLabelText('Remove Course: Main');
    fireEvent.click(removeButton);
    expect(handleRemove).toHaveBeenCalledWith('Course: Main');
  });

  it('should handle keyboard navigation', () => {
    const handleClick = vi.fn();
    render(
      <CategoryChip
        category="Course: Main"
        variant="clickable"
        onClick={handleClick}
      />
    );

    const chip = screen.getByRole('button');
    fireEvent.keyDown(chip, { key: 'Enter' });
    expect(handleClick).toHaveBeenCalledWith('Course: Main');
  });

  it('should be disabled when disabled prop is true', () => {
    const handleClick = vi.fn();
    render(
      <CategoryChip
        category="Course: Main"
        onClick={handleClick}
        disabled
      />
    );

    const chip = screen.getByText('Main').closest('span');
    expect(chip).toHaveClass('opacity-50');

    fireEvent.click(chip!);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('should render different sizes correctly', () => {
    const { rerender } = render(<CategoryChip category="Test" size="sm" />);
    expect(screen.getByText('Test').closest('span')).toHaveClass('badge-sm');

    rerender(<CategoryChip category="Test" size="lg" />);
    expect(screen.getByText('Test').closest('span')).toHaveClass('badge-lg');
  });
});
```

### **2. Category Display Tests**

**File**: `src/__tests__/components/recipes/category-display.test.tsx`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CategoryDisplay } from '@/components/recipes/category-display';

describe('CategoryDisplay', () => {
  const mockCategories = [
    'Course: Main',
    'Cuisine: Italian',
    'Technique: Bake'
  ];

  it('should render all categories', () => {
    render(<CategoryDisplay categories={mockCategories} />);

    expect(screen.getByText('Main')).toBeInTheDocument();
    expect(screen.getByText('Italian')).toBeInTheDocument();
    expect(screen.getByText('Bake')).toBeInTheDocument();
  });

  it('should render title when provided', () => {
    render(
      <CategoryDisplay
        categories={mockCategories}
        title="Recipe Categories"
      />
    );

    expect(screen.getByText('Recipe Categories')).toBeInTheDocument();
  });

  it('should limit visible categories when maxVisible is set', () => {
    render(
      <CategoryDisplay
        categories={mockCategories}
        maxVisible={2}
      />
    );

    // Should show 2 categories plus "+1 more"
    expect(screen.getByText('+1 more')).toBeInTheDocument();
  });

  it('should not render when categories is empty and showEmpty is false', () => {
    const { container } = render(
      <CategoryDisplay categories={[]} showEmpty={false} />
    );

    expect(container.firstChild).toBeNull();
  });

  it('should render empty state when showEmpty is true', () => {
    render(
      <CategoryDisplay
        categories={[]}
        showEmpty={true}
        emptyText="No categories yet"
      />
    );

    expect(screen.getByText('No categories yet')).toBeInTheDocument();
  });

  it('should handle category clicks', () => {
    const handleClick = vi.fn();
    render(
      <CategoryDisplay
        categories={mockCategories}
        onCategoryClick={handleClick}
      />
    );

    const courseChip = screen.getByText('Main').closest('span');
    fireEvent.click(courseChip!);

    expect(handleClick).toHaveBeenCalledWith('Course: Main');
  });
});
```

### **3. Category Input Tests**

**File**: `src/__tests__/components/ui/category-input.test.tsx`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CategoryInput } from '@/components/ui/category-input';

describe('CategoryInput', () => {
  it('should render selected categories as chips', () => {
    const mockCategories = ['Course: Main', 'Cuisine: Italian'];
    render(
      <CategoryInput
        value={mockCategories}
        onChange={vi.fn()}
      />
    );

    expect(screen.getByText('Main')).toBeInTheDocument();
    expect(screen.getByText('Italian')).toBeInTheDocument();
  });

  it('should add category when Enter is pressed', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();

    render(
      <CategoryInput
        value={[]}
        onChange={handleChange}
      />
    );

    const input = screen.getByPlaceholderText('Add category...');
    await user.type(input, 'Course: Main');
    await user.keyboard('{Enter}');

    expect(handleChange).toHaveBeenCalledWith(['Course: Main']);
  });

  it('should show suggestions dropdown when typing', async () => {
    const user = userEvent.setup();
    render(
      <CategoryInput
        value={[]}
        onChange={vi.fn()}
        suggestions={['Course: Main', 'Course: Dessert']}
      />
    );

    const input = screen.getByPlaceholderText('Add category...');
    await user.type(input, 'Course');

    await waitFor(() => {
      expect(screen.getByText('Course: Main')).toBeInTheDocument();
      expect(screen.getByText('Course: Dessert')).toBeInTheDocument();
    });
  });

  it('should remove category when remove button is clicked', () => {
    const handleChange = vi.fn();
    render(
      <CategoryInput
        value={['Course: Main']}
        onChange={handleChange}
      />
    );

    const removeButton = screen.getByLabelText('Remove Course: Main');
    fireEvent.click(removeButton);

    expect(handleChange).toHaveBeenCalledWith([]);
  });

  it('should prevent adding duplicate categories', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();

    render(
      <CategoryInput
        value={['Course: Main']}
        onChange={handleChange}
      />
    );

    const input = screen.getByPlaceholderText('Add category...');
    await user.type(input, 'Course: Main');
    await user.keyboard('{Enter}');

    expect(handleChange).not.toHaveBeenCalled();
  });

  it('should respect maxCategories limit', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();

    render(
      <CategoryInput
        value={['Category 1', 'Category 2']}
        onChange={handleChange}
        maxCategories={2}
      />
    );

    const input = screen.getByPlaceholderText(/Max 2 categories/);
    expect(input).toBeDisabled();
  });

  it('should handle keyboard navigation in dropdown', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();

    render(
      <CategoryInput
        value={[]}
        onChange={handleChange}
        suggestions={['Course: Main', 'Course: Dessert']}
      />
    );

    const input = screen.getByPlaceholderText('Add category...');
    await user.type(input, 'Course');
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{Enter}');

    expect(handleChange).toHaveBeenCalledWith(['Course: Main']);
  });
});
```

## 📋 **Implementation Checklist**

### **Core Components**

- [ ] Create `CategoryChip` component with all variants
- [ ] Create `CategoryDisplay` component for recipe views
- [ ] Create `CategoryInput` component for forms
- [ ] Create `CategoryFilter` component for filtering
- [ ] Create `CategoryStats` component for analytics
- [ ] Add proper TypeScript types for all components

### **Accessibility**

- [ ] Add ARIA labels and roles
- [ ] Implement keyboard navigation
- [ ] Add focus management
- [ ] Test with screen readers
- [ ] Ensure color contrast compliance
- [ ] Add proper semantic HTML

### **Visual Design**

- [ ] Integrate with DaisyUI design system
- [ ] Create consistent spacing and sizing
- [ ] Add hover and focus states
- [ ] Implement responsive design
- [ ] Add smooth transitions and animations
- [ ] Test across different themes

### **Testing**

- [ ] Write unit tests for all components
- [ ] Write integration tests for component interactions
- [ ] Write accessibility tests
- [ ] Write visual regression tests
- [ ] Test keyboard navigation
- [ ] Test responsive behavior

### **Documentation**

- [ ] Document component APIs
- [ ] Create usage examples
- [ ] Document accessibility features
- [ ] Create design system guidelines
- [ ] Document testing procedures

## 🎨 **Design System Integration**

### **Color Scheme**

- **Primary chips**: `badge-primary` for selected/active states
- **Secondary chips**: `badge-secondary` for removable chips
- **Neutral chips**: `badge-neutral` for default display
- **Outline chips**: `badge-outline` for clickable states

### **Typography**

- **Namespace**: `font-medium opacity-75` for subtle emphasis
- **Value**: Regular weight for readability
- **Sizes**: `text-xs` (sm), `text-sm` (md), `text-base` (lg)

### **Spacing**

- **Chip gaps**: `gap-1` (compact), `gap-2` (default)
- **Internal padding**: Handled by DaisyUI badge classes
- **Component margins**: `mb-2` to `mb-4` for sections

### **Interactive States**

- **Hover**: `hover:badge-primary` for clickable chips
- **Focus**: Proper focus rings with `focus:ring-2`
- **Active**: `badge-primary` for selected state
- **Disabled**: `opacity-50 cursor-not-allowed`

## ✅ **Success Criteria**

- [ ] All components render correctly in all variants
- [ ] Components are fully accessible (WCAG 2.1 AA)
- [ ] Components integrate seamlessly with DaisyUI
- [ ] All interactive states work properly
- [ ] Components are responsive across screen sizes
- [ ] Performance is optimal (< 16ms render time)
- [ ] Test coverage is > 90%

## 🔗 **Next Phase**

Once Phase 4 is complete, proceed to [Phase 5: Integration Points](phase-5-integration-points.md) to integrate these components into the recipe system.

---

**Phase Status**: 📋 Ready for Implementation  
**Estimated Time**: 3-4 days  
**Prerequisites**: Phase 3 complete  
**Next Phase**: [Phase 5 - Integration Points](phase-5-integration-points.md)
