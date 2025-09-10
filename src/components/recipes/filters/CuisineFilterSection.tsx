import { useState, useMemo } from 'react';
import { Search, Check, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CUISINE_REGIONS, searchCuisines } from '@/lib/cuisines';
import type { Cuisine } from '@/lib/types';

interface CuisineFilterSectionProps {
  selectedCuisines: Cuisine[];
  onCuisinesChange: (cuisines: Cuisine[]) => void;
  variant: 'dropdown' | 'accordion' | 'drawer';
  className?: string;
}

export function CuisineFilterSection({
  selectedCuisines,
  onCuisinesChange,
  variant,
  className = '',
}: CuisineFilterSectionProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRegions, setExpandedRegions] = useState<Set<string>>(
    new Set()
  );
  const [isOpen, setIsOpen] = useState(false);

  // Filter cuisines based on search term
  const filteredRegions = useMemo(() => {
    if (!searchTerm) return CUISINE_REGIONS;

    const searchResults = searchCuisines(searchTerm);
    const filteredData: typeof CUISINE_REGIONS = {};

    Object.entries(CUISINE_REGIONS).forEach(([region, data]) => {
      const matchingCuisines = data.cuisines.filter((cuisine) =>
        searchResults.includes(cuisine as Cuisine)
      );

      if (matchingCuisines.length > 0) {
        filteredData[region] = {
          ...data,
          cuisines: matchingCuisines,
        };
      }
    });

    return filteredData;
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
            Cuisines{' '}
            {selectedCuisines.length > 0 && `(${selectedCuisines.length})`}
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
                  placeholder="Search cuisines..."
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
                      {regionData.cuisines.map((cuisine) => {
                        const isSelected = selectedCuisines.includes(
                          cuisine as Cuisine
                        );
                        return (
                          <Button
                            key={cuisine}
                            variant={isSelected ? 'default' : 'outline'}
                            size="sm"
                            className="justify-start text-xs h-9 hover:bg-gray-50 transition-colors"
                            onClick={() => toggleCuisine(cuisine as Cuisine)}
                          >
                            {isSelected && <Check className="h-3 w-3 mr-1" />}
                            <span className="truncate">{cuisine}</span>
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                )
              )}
            </div>

            {selectedCuisines.length > 0 && (
              <div className="p-4 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllCuisines}
                  className="w-full text-xs hover:bg-gray-50"
                >
                  Clear All Cuisines
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
          <h4 className="font-medium">Cuisines</h4>
          {selectedCuisines.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllCuisines}
              className="text-xs"
            >
              Clear All ({selectedCuisines.length})
            </Button>
          )}
        </div>

        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 h-4 w-4 text-gray-400 -translate-y-1/2" />
          <Input
            placeholder="Search cuisines..."
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
                    {regionData.cuisines.map((cuisine) => {
                      const isSelected = selectedCuisines.includes(
                        cuisine as Cuisine
                      );
                      return (
                        <Button
                          key={cuisine}
                          variant={isSelected ? 'default' : 'outline'}
                          size="sm"
                          className="justify-start text-xs h-8"
                          onClick={() => toggleCuisine(cuisine as Cuisine)}
                        >
                          {isSelected && <Check className="h-3 w-3 mr-1" />}
                          <span className="truncate">{cuisine}</span>
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
        <h4 className="font-medium">Cuisines</h4>
        {selectedCuisines.length > 0 && (
          <span className="text-sm text-gray-600">
            {selectedCuisines.length} selected
          </span>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 text-gray-400 -translate-y-1/2" />
        <Input
          placeholder="Search cuisines..."
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
              {regionData.cuisines.map((cuisine) => {
                const isSelected = selectedCuisines.includes(
                  cuisine as Cuisine
                );
                return (
                  <Button
                    key={cuisine}
                    variant={isSelected ? 'default' : 'outline'}
                    size="sm"
                    className="justify-start text-xs h-9"
                    onClick={() => toggleCuisine(cuisine as Cuisine)}
                  >
                    {isSelected && <Check className="h-3 w-3 mr-1" />}
                    <span className="truncate">{cuisine}</span>
                  </Button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {selectedCuisines.length > 0 && (
        <div className="pt-3 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllCuisines}
            className="w-full text-xs"
          >
            Clear All Cuisines
          </Button>
        </div>
      )}
    </div>
  );
}
