import { useState, useMemo } from 'react';
import { Search, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NestedDrawer } from '@/components/ui/nested-drawer';
import { CANONICAL_CATEGORIES } from '@/lib/categories';
import { parseCategory } from '@/lib/category-utils';

interface CategorySelectionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onCloseAll?: () => void;
  onBack: () => void;
  selectedCategories: string[];
  onCategoriesChange: (categories: string[]) => void;
  className?: string;
}

export function CategorySelectionDrawer({
  isOpen,
  onClose,
  onCloseAll,
  onBack,
  selectedCategories,
  onCategoriesChange,
  className = '',
}: CategorySelectionDrawerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isApplyFeedback, setIsApplyFeedback] = useState(false);

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

  const selectAllInGroup = (groupName: string) => {
    const groupCategories = filteredGroups[groupName] || [];
    const newCategories = [...selectedCategories];

    groupCategories.forEach((category) => {
      if (!newCategories.includes(category)) {
        newCategories.push(category);
      }
    });

    onCategoriesChange(newCategories);
  };

  const deselectAllInGroup = (groupName: string) => {
    const groupCategories = filteredGroups[groupName] || [];
    const newCategories = selectedCategories.filter(
      (category) => !groupCategories.includes(category)
    );
    onCategoriesChange(newCategories);
  };

  const isGroupFullySelected = (groupName: string) => {
    const groupCategories = filteredGroups[groupName] || [];
    return groupCategories.every((category) =>
      selectedCategories.includes(category)
    );
  };

  const isGroupPartiallySelected = (groupName: string) => {
    const groupCategories = filteredGroups[groupName] || [];
    const selectedInGroup = groupCategories.filter((category) =>
      selectedCategories.includes(category)
    );
    return (
      selectedInGroup.length > 0 &&
      selectedInGroup.length < groupCategories.length
    );
  };

  return (
    <NestedDrawer
      id="category-selection-drawer"
      isOpen={isOpen}
      onClose={onClose}
      title="Select Categories"
      showBackButton={true}
      onBack={onBack}
      backButtonText="Back to Filters"
      className={className}
    >
      <div className="space-y-6 pb-20">
        {/* Search */}
        <div>
          <label className="label">
            <span className="label-text font-medium">Filter categories</span>
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Category Groups */}
        <div className="space-y-6">
          {Object.entries(filteredGroups).map(([groupName, categories]) => (
            <div key={groupName} className="space-y-3">
              {/* Group Header with Actions */}
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-800">{groupName}</h4>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => selectAllInGroup(groupName)}
                    disabled={isGroupFullySelected(groupName)}
                    className="text-xs px-2 py-1 h-6"
                  >
                    All
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deselectAllInGroup(groupName)}
                    disabled={
                      !isGroupPartiallySelected(groupName) &&
                      !isGroupFullySelected(groupName)
                    }
                    className="text-xs px-2 py-1 h-6"
                  >
                    None
                  </Button>
                </div>
              </div>

              {/* Category Buttons */}
              <div className="grid grid-cols-2 gap-2">
                {categories.map((category) => {
                  const isSelected = selectedCategories.includes(category);
                  // Extract just the value part (after the namespace colon)
                  const displayValue = category.includes(': ')
                    ? category.split(': ')[1]
                    : category;
                  return (
                    <Button
                      key={category}
                      variant={isSelected ? 'default' : 'outline'}
                      size="sm"
                      className="justify-start text-xs h-10"
                      onClick={() => toggleCategory(category)}
                      title={category} // Show full category on hover for context
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

        {/* Selection Summary */}
        {selectedCategories.length > 0 && (
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium">
                {selectedCategories.length} categories selected
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllCategories}
                className="text-xs"
              >
                Clear All
              </Button>
            </div>

            {/* Selected Categories Display */}
            <div className="flex flex-wrap gap-2">
              {selectedCategories.slice(0, 6).map((category) => (
                <span
                  key={category}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary/10 text-primary border border-primary/20"
                >
                  {category}
                </span>
              ))}
              {selectedCategories.length > 6 && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
                  +{selectedCategories.length - 6} more
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Persistent Action Buttons - Sticky Footer */}
      <div className="sticky bottom-0 left-0 right-0 bg-base-100 border-t pt-4 pb-4 px-4 -mx-4 space-y-3">
        {/* Apply Button - Provides feedback that selections are applied */}
        <Button
          className={`w-full transition-all duration-300 ${
            isApplyFeedback
              ? 'bg-green-600 hover:bg-green-700 cursor-not-allowed'
              : ''
          }`}
          onClick={() => {
            // Categories are applied immediately, just show feedback
            setIsApplyFeedback(true);

            // Reset feedback state after 2 seconds
            setTimeout(() => {
              setIsApplyFeedback(false);
            }, 2000);
          }}
          size="lg"
          variant="default"
          disabled={isApplyFeedback}
        >
          {isApplyFeedback ? '✓ Applied' : 'Apply'}
        </Button>

        {/* Done Button - Closes the current drawer */}
        <Button
          className="w-full"
          onClick={onClose}
          size="sm"
          variant="outline"
        >
          Done
        </Button>

        {/* All Done Button - Closes all drawers and returns to main page */}
        <Button
          onClick={() => {
            // Close all drawers by calling the closeAll function
            if (onCloseAll) {
              onCloseAll();
            }
          }}
          size="sm"
          variant="ghost"
          className="w-full text-gray-600 hover:text-gray-800 hover:bg-gray-100"
        >
          All Done
        </Button>
      </div>
    </NestedDrawer>
  );
}
