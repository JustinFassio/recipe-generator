import { useState, useMemo } from 'react';
import { Search, Check, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MOOD_REGIONS, searchMoods } from '@/lib/moods';
import type { Mood } from '@/lib/types';

interface MoodFilterSectionProps {
  selectedMoods: Mood[];
  onMoodsChange: (moods: Mood[]) => void;
  variant: 'dropdown' | 'accordion' | 'drawer';
  className?: string;
}

export function MoodFilterSection({
  selectedMoods,
  onMoodsChange,
  variant,
  className = '',
}: MoodFilterSectionProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRegions, setExpandedRegions] = useState<Set<string>>(
    new Set()
  );
  const [isOpen, setIsOpen] = useState(false);

  // Filter moods based on search term
  const filteredRegions = useMemo(() => {
    if (!searchTerm) return MOOD_REGIONS;

    const searchResults = searchMoods(searchTerm);
    const filteredData: typeof MOOD_REGIONS = {};

    Object.entries(MOOD_REGIONS).forEach(([region, data]) => {
      const matchingMoods = data.moods.filter((mood) =>
        searchResults.includes(mood)
      );

      if (matchingMoods.length > 0) {
        filteredData[region] = {
          ...data,
          moods: matchingMoods,
        };
      }
    });

    return filteredData;
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

  const toggleRegion = (regionName: string) => {
    const newExpanded = new Set(expandedRegions);
    if (newExpanded.has(regionName)) {
      newExpanded.delete(regionName);
    } else {
      newExpanded.add(regionName);
    }
    setExpandedRegions(newExpanded);
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
            Moods {selectedMoods.length > 0 && `(${selectedMoods.length})`}
          </span>
          <ChevronDown
            className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </Button>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border rounded-lg shadow-lg max-h-80 overflow-y-auto w-96">
            <div className="p-4 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 text-gray-400 -translate-y-1/2" />
                <Input
                  placeholder="Search moods..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="p-4 space-y-4">
              {Object.entries(filteredRegions).map(
                ([regionName, regionData]) => (
                  <div key={regionName} className="space-y-2">
                    <h5 className="text-sm font-medium text-gray-700 border-b pb-1">
                      {regionName}
                    </h5>
                    <div className="grid grid-cols-3 gap-2">
                      {regionData.moods.map((mood) => {
                        const isSelected = selectedMoods.includes(mood as Mood);
                        return (
                          <Button
                            key={mood}
                            variant={isSelected ? 'default' : 'outline'}
                            size="sm"
                            className="justify-start text-xs h-9 hover:bg-gray-50 transition-colors"
                            onClick={() => toggleMood(mood as Mood)}
                          >
                            {isSelected && <Check className="h-3 w-3 mr-1" />}
                            <span className="truncate">{mood}</span>
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                )
              )}
            </div>

            {selectedMoods.length > 0 && (
              <div className="p-4 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllMoods}
                  className="w-full text-xs hover:bg-gray-50"
                >
                  Clear All Moods
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
          <h4 className="font-medium">Moods</h4>
          {selectedMoods.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllMoods}
              className="text-xs"
            >
              Clear All ({selectedMoods.length})
            </Button>
          )}
        </div>

        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 h-4 w-4 text-gray-400 -translate-y-1/2" />
          <Input
            placeholder="Search moods..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="space-y-2">
          {Object.entries(filteredRegions).map(([regionName, regionData]) => {
            const isExpanded = expandedRegions.has(regionName);
            return (
              <div key={regionName} className="border rounded-md">
                <Button
                  variant="ghost"
                  onClick={() => toggleRegion(regionName)}
                  className="w-full justify-between p-3 h-auto"
                >
                  <span className="font-medium">{regionName}</span>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  />
                </Button>

                {isExpanded && (
                  <div className="p-3 pt-0 grid grid-cols-2 gap-2">
                    {regionData.moods.map((mood) => {
                      const isSelected = selectedMoods.includes(mood as Mood);
                      return (
                        <Button
                          key={mood}
                          variant={isSelected ? 'default' : 'outline'}
                          size="sm"
                          className="justify-start text-xs h-8"
                          onClick={() => toggleMood(mood as Mood)}
                        >
                          {isSelected && <Check className="h-3 w-3 mr-1" />}
                          <span className="truncate">{mood}</span>
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
        <h4 className="font-medium">Moods</h4>
        {selectedMoods.length > 0 && (
          <span className="text-sm text-gray-600">
            {selectedMoods.length} selected
          </span>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 text-gray-400 -translate-y-1/2" />
        <Input
          placeholder="Search moods..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="space-y-4">
        {Object.entries(filteredRegions).map(([regionName, regionData]) => (
          <div key={regionName} className="space-y-2">
            <h5 className="text-sm font-medium text-gray-700">{regionName}</h5>
            <div className="grid grid-cols-2 gap-2">
              {regionData.moods.map((mood) => {
                const isSelected = selectedMoods.includes(mood as Mood);
                return (
                  <Button
                    key={mood}
                    variant={isSelected ? 'default' : 'outline'}
                    size="sm"
                    className="justify-start text-xs h-9"
                    onClick={() => toggleMood(mood as Mood)}
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

      {selectedMoods.length > 0 && (
        <div className="pt-3 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllMoods}
            className="w-full text-xs"
          >
            Clear All Moods
          </Button>
        </div>
      )}
    </div>
  );
}
