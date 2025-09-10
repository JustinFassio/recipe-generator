import { useState, useMemo } from 'react';
import { Search, Check, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CANONICAL_CATEGORIES } from '@/lib/categories';
import { parseCategory } from '@/lib/category-utils';

interface CategoryFilterSectionProps {
  selectedCategories: string[];
  onCategoriesChange: (categories: string[]) => void;
  variant: 'dropdown' | 'accordion' | 'drawer';
  className?: string;
}

export function CategoryFilterSection({
  selectedCategories,
  onCategoriesChange,
  variant,
  className = '',
}: CategoryFilterSectionProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [isOpen, setIsOpen] = useState(false);

  // Group categories by namespace for better organization
  const groupedCategories = useMemo(() => {
    return CANONICAL_CATEGORIES.reduce(
      (groups, category) => {
        const { namespace } = parseCategory(category);
        const groupKey = namespace || 'Other';

        if (!groups[groupKey]) {
          groups[groupKey] = [];
        }
        groups[groupKey].push(category);

        return groups;
      },
      {} as Record<string, string[]>
    );
  }, []);

  // Filter categories based on search term
  const filteredGroups = useMemo(() => {
    if (!searchTerm) return groupedCategories;

    return Object.entries(groupedCategories).reduce(
      (filtered, [namespace, categories]) => {
        const matchingCategories = categories.filter((category) =>
          category.toLowerCase().includes(searchTerm.toLowerCase())
        );

        if (matchingCategories.length > 0) {
          filtered[namespace] = matchingCategories;
        }

        return filtered;
      },
      {} as Record<string, string[]>
    );
  }, [groupedCategories, searchTerm]);

  const toggleCategory = (category: string) => {
    const newCategories = selectedCategories.includes(category)
      ? selectedCategories.filter((c) => c !== category)
      : [...selectedCategories, category];
    onCategoriesChange(newCategories);
  };

  const clearAllCategories = () => {
    onCategoriesChange([]);
  };

  const toggleGroup = (groupName: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupName)) {
      newExpanded.delete(groupName);
    } else {
      newExpanded.add(groupName);
    }
    setExpandedGroups(newExpanded);
  };

  if (variant === 'dropdown') {
    return (
      <div className={`relative ${className}`}>
        <Button
          variant="outline"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full justify-between"
        >
          <span>
            Categories{' '}
            {selectedCategories.length > 0 && `(${selectedCategories.length})`}
          </span>
          <ChevronDown
            className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </Button>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border rounded-md shadow-lg max-h-80 overflow-y-auto">
            <div className="p-3 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 text-gray-400 -translate-y-1/2" />
                <Input
                  placeholder="Search categories..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="p-2 space-y-2">
              {Object.entries(filteredGroups).map(([groupName, categories]) => (
                <div key={groupName}>
                  <div className="px-2 py-1 text-sm font-medium text-gray-600">
                    {groupName}
                  </div>
                  {categories.map((category) => {
                    const isSelected = selectedCategories.includes(category);
                    const displayValue = category.includes(': ')
                      ? category.split(': ')[1]
                      : category;
                    return (
                      <Button
                        key={category}
                        variant={isSelected ? 'default' : 'ghost'}
                        size="sm"
                        className="w-full justify-start text-xs h-8"
                        onClick={() => toggleCategory(category)}
                      >
                        {isSelected && <Check className="h-3 w-3 mr-1" />}
                        <span className="truncate">{displayValue}</span>
                      </Button>
                    );
                  })}
                </div>
              ))}
            </div>

            {selectedCategories.length > 0 && (
              <div className="p-2 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllCategories}
                  className="w-full text-xs"
                >
                  Clear All
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  if (variant === 'accordion') {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="flex items-center justify-between">
          <h4 className="font-medium">Categories</h4>
          {selectedCategories.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllCategories}
              className="text-xs"
            >
              Clear All ({selectedCategories.length})
            </Button>
          )}
        </div>

        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 h-4 w-4 text-gray-400 -translate-y-1/2" />
          <Input
            placeholder="Search categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="space-y-2">
          {Object.entries(filteredGroups).map(([groupName, categories]) => {
            const isExpanded = expandedGroups.has(groupName);
            return (
              <div key={groupName} className="border rounded-md">
                <Button
                  variant="ghost"
                  onClick={() => toggleGroup(groupName)}
                  className="w-full justify-between p-3 h-auto"
                >
                  <span className="font-medium">{groupName}</span>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  />
                </Button>

                {isExpanded && (
                  <div className="p-3 pt-0 grid grid-cols-2 gap-2">
                    {categories.map((category) => {
                      const isSelected = selectedCategories.includes(category);
                      const displayValue = category.includes(': ')
                        ? category.split(': ')[1]
                        : category;
                      return (
                        <Button
                          key={category}
                          variant={isSelected ? 'default' : 'outline'}
                          size="sm"
                          className="justify-start text-xs h-8"
                          onClick={() => toggleCategory(category)}
                        >
                          {isSelected && <Check className="h-3 w-3 mr-1" />}
                          <span className="truncate">{displayValue}</span>
                        </Button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Drawer variant - simplified for mobile
  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <h4 className="font-medium">Categories</h4>
        {selectedCategories.length > 0 && (
          <span className="text-sm text-gray-600">
            {selectedCategories.length} selected
          </span>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 text-gray-400 -translate-y-1/2" />
        <Input
          placeholder="Search categories..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="space-y-4">
        {Object.entries(filteredGroups).map(([groupName, categories]) => (
          <div key={groupName} className="space-y-2">
            <h5 className="text-sm font-medium text-gray-700">{groupName}</h5>
            <div className="grid grid-cols-2 gap-2">
              {categories.map((category) => {
                const isSelected = selectedCategories.includes(category);
                const displayValue = category.includes(': ')
                  ? category.split(': ')[1]
                  : category;
                return (
                  <Button
                    key={category}
                    variant={isSelected ? 'default' : 'outline'}
                    size="sm"
                    className="justify-start text-xs h-9"
                    onClick={() => toggleCategory(category)}
                  >
                    {isSelected && <Check className="h-3 w-3 mr-1" />}
                    <span className="truncate">{displayValue}</span>
                  </Button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {selectedCategories.length > 0 && (
        <div className="pt-3 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllCategories}
            className="w-full text-xs"
          >
            Clear All Categories
          </Button>
        </div>
      )}
    </div>
  );
}
