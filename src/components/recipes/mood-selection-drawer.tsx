import { useState, useMemo } from 'react';
import { Search, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NestedDrawer } from '@/components/ui/nested-drawer';
import { MOOD_REGIONS } from '@/lib/moods';
import type { Mood } from '@/lib/types';

interface MoodSelectionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onCloseAll?: () => void;
  onBack: () => void;
  selectedMoods: Mood[];
  onMoodsChange: (moods: Mood[]) => void;
  className?: string;
}

export function MoodSelectionDrawer({
  isOpen,
  onClose,
  onCloseAll,
  onBack,
  selectedMoods,
  onMoodsChange,
  className = '',
}: MoodSelectionDrawerProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter moods based on search term
  const filteredRegions = useMemo(() => {
    if (!searchTerm) return MOOD_REGIONS;

    return Object.entries(MOOD_REGIONS).reduce(
      (filtered, [region, data]) => {
        const regionMoods = data.moods.filter((mood) =>
          mood.toLowerCase().includes(searchTerm.toLowerCase())
        );

        if (regionMoods.length > 0) {
          filtered[region] = {
            ...data,
            moods: regionMoods,
          };
        }

        return filtered;
      },
      {} as typeof MOOD_REGIONS
    );
  }, [searchTerm]);

  const toggleMood = (mood: Mood) => {
    const newMoods = selectedMoods.includes(mood)
      ? selectedMoods.filter((m) => m !== mood)
      : [...selectedMoods, mood];
    onMoodsChange(newMoods);
  };

  const clearAllMoods = () => {
    onMoodsChange([]);
  };

  const selectAllInRegion = (regionName: string) => {
    const regionMoods = filteredRegions[regionName]?.moods || [];
    const newMoods = [...selectedMoods];

    regionMoods.forEach((mood) => {
      if (!newMoods.includes(mood)) {
        newMoods.push(mood);
      }
    });

    onMoodsChange(newMoods);
  };

  const deselectAllInRegion = (regionName: string) => {
    const regionMoods = filteredRegions[regionName]?.moods || [];
    const newMoods = selectedMoods.filter(
      (mood) => !regionMoods.includes(mood)
    );
    onMoodsChange(newMoods);
  };

  const isRegionFullySelected = (regionName: string) => {
    const regionMoods = filteredRegions[regionName]?.moods || [];
    return regionMoods.every((mood) => selectedMoods.includes(mood));
  };

  const isRegionPartiallySelected = (regionName: string) => {
    const regionMoods = filteredRegions[regionName]?.moods || [];
    const selectedInRegion = regionMoods.filter((mood) =>
      selectedMoods.includes(mood)
    );
    return (
      selectedInRegion.length > 0 &&
      selectedInRegion.length < regionMoods.length
    );
  };

  return (
    <NestedDrawer
      id="mood-selection-drawer"
      isOpen={isOpen}
      onClose={onClose}
      title="Select Moods"
      showBackButton={true}
      onBack={onBack}
      backButtonText="Back to Filters"
      className={className}
    >
      <div className="space-y-6 pb-20">
        {/* Search */}
        <div>
          <label className="label">
            <span className="label-text font-medium">Filter moods</span>
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search moods..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Mood Regions */}
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

              {/* Mood Buttons */}
              <div className="grid grid-cols-2 gap-2">
                {data.moods.map((mood) => {
                  const isSelected = selectedMoods.includes(mood);
                  return (
                    <Button
                      key={mood}
                      variant={isSelected ? 'default' : 'outline'}
                      size="sm"
                      className="justify-start text-xs h-10"
                      onClick={() => toggleMood(mood)}
                    >
                      {isSelected && <Check className="h-3 w-3 mr-1" />}
                      <span className="truncate">{mood}</span>
                    </Button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Selection Summary */}
        {selectedMoods.length > 0 && (
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium">
                {selectedMoods.length} moods selected
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllMoods}
                className="text-xs"
              >
                Clear All
              </Button>
            </div>

            {/* Selected Moods Display */}
            <div className="flex flex-wrap gap-2">
              {selectedMoods.slice(0, 6).map((mood) => (
                <span
                  key={mood}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary/10 text-primary border border-primary/20"
                >
                  {mood}
                </span>
              ))}
              {selectedMoods.length > 6 && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
                  +{selectedMoods.length - 6} more
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
          className="w-full"
          onClick={() => {
            // Moods are applied immediately, just show feedback
            const button = document.activeElement as HTMLButtonElement;
            if (button) {
              button.textContent = '✓ Applied';
              button.disabled = true;
              button.className =
                'w-full bg-green-600 hover:bg-green-700 cursor-not-allowed transition-all duration-300';

              setTimeout(() => {
                button.textContent = 'Apply';
                button.disabled = false;
                button.className = 'w-full transition-all duration-300';
              }, 2000);
            }
          }}
          size="lg"
          variant="default"
        >
          Apply
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
