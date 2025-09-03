import { useState, useMemo } from 'react';
import { Search, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NestedDrawer } from '@/components/ui/nested-drawer';
import { CUISINE_LABELS, CUISINE_REGIONS } from '@/lib/cuisines';
import type { Cuisine } from '@/lib/types';

interface CuisineSelectionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onCloseAll?: () => void;
  onBack: () => void;
  selectedCuisines: Cuisine[];
  onCuisinesChange: (cuisines: Cuisine[]) => void;
  className?: string;
}

export function CuisineSelectionDrawer({
  isOpen,
  onClose,
  onCloseAll,
  onBack,
  selectedCuisines,
  onCuisinesChange,
  className = '',
}: CuisineSelectionDrawerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isApplyFeedback, setIsApplyFeedback] = useState(false);

  // Filter cuisines based on search term
  const filteredRegions = useMemo(() => {
    if (!searchTerm) return CUISINE_REGIONS;

    return Object.entries(CUISINE_REGIONS).reduce(
      (filtered, [region, data]) => {
        const matchingCuisines = data.cuisines.filter((cuisine) =>
          cuisine.toLowerCase().includes(searchTerm.toLowerCase())
        );

        if (matchingCuisines.length > 0) {
          filtered[region] = {
            ...data,
            cuisines: matchingCuisines,
          };
        }

        return filtered;
      },
      {} as typeof CUISINE_REGIONS
    );
  }, [searchTerm]);

  const toggleCuisine = (cuisine: Cuisine) => {
    const newCuisines = selectedCuisines.includes(cuisine)
      ? selectedCuisines.filter((c) => c !== cuisine)
      : [...selectedCuisines, cuisine];
    onCuisinesChange(newCuisines);
  };

  const clearAllCuisines = () => {
    onCuisinesChange([]);
  };

  const selectAllInRegion = (regionName: string) => {
    const regionCuisines = filteredRegions[regionName]?.cuisines || [];
    const newCuisines = [...selectedCuisines];

    regionCuisines.forEach((cuisine) => {
      if (!newCuisines.includes(cuisine)) {
        newCuisines.push(cuisine);
      }
    });

    onCuisinesChange(newCuisines);
  };

  const deselectAllInRegion = (regionName: string) => {
    const regionCuisines = filteredRegions[regionName]?.cuisines || [];
    const newCuisines = selectedCuisines.filter(
      (cuisine) => !regionCuisines.includes(cuisine)
    );
    onCuisinesChange(newCuisines);
  };

  const isRegionFullySelected = (regionName: string) => {
    const regionCuisines = filteredRegions[regionName]?.cuisines || [];
    return regionCuisines.every((cuisine) =>
      selectedCuisines.includes(cuisine)
    );
  };

  const isRegionPartiallySelected = (regionName: string) => {
    const regionCuisines = filteredRegions[regionName]?.cuisines || [];
    const selectedInRegion = regionCuisines.filter((cuisine) =>
      selectedCuisines.includes(cuisine)
    );
    return (
      selectedInRegion.length > 0 &&
      selectedInRegion.length < regionCuisines.length
    );
  };

  return (
    <NestedDrawer
      id="cuisine-selection-drawer"
      isOpen={isOpen}
      onClose={onClose}
      title="Select Cuisines"
      showBackButton={true}
      onBack={onBack}
      backButtonText="Back to Filters"
      className={className}
    >
      <div className="space-y-6 pb-20">
        {/* Search */}
        <div>
          <label className="label">
            <span className="label-text font-medium">Filter cuisines</span>
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search cuisines..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Cuisine Regions */}
        <div className="space-y-6">
          {Object.entries(filteredRegions).map(([region, data]) => (
            <div key={region} className="space-y-3">
              {/* Region Header with Actions */}
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-800">{region}</h4>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => selectAllInRegion(region)}
                    disabled={isRegionFullySelected(region)}
                    className="text-xs px-2 py-1 h-6"
                  >
                    All
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deselectAllInRegion(region)}
                    disabled={
                      !isRegionPartiallySelected(region) &&
                      !isRegionFullySelected(region)
                    }
                    className="text-xs px-2 py-1 h-6"
                  >
                    None
                  </Button>
                </div>
              </div>

              {/* Cuisine Buttons */}
              <div className="grid grid-cols-2 gap-2">
                {data.cuisines.map((cuisine) => {
                  const isSelected = selectedCuisines.includes(cuisine);
                  return (
                    <Button
                      key={cuisine}
                      variant={isSelected ? 'default' : 'outline'}
                      size="sm"
                      className="justify-start text-xs h-10"
                      onClick={() => toggleCuisine(cuisine)}
                    >
                      {isSelected && <Check className="h-3 w-3 mr-1" />}
                      <span className="truncate">
                        {CUISINE_LABELS[cuisine]}
                      </span>
                    </Button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Selection Summary */}
        {selectedCuisines.length > 0 && (
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium">
                {selectedCuisines.length} cuisines selected
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllCuisines}
                className="text-xs"
              >
                Clear All
              </Button>
            </div>

            {/* Selected Cuisines Display */}
            <div className="flex flex-wrap gap-2">
              {selectedCuisines.slice(0, 6).map((cuisine) => (
                <span
                  key={cuisine}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary/10 text-primary border border-primary/20"
                >
                  {CUISINE_LABELS[cuisine]}
                </span>
              ))}
              {selectedCuisines.length > 6 && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
                  +{selectedCuisines.length - 6} more
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
            // Cuisines are applied immediately, just show feedback
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
