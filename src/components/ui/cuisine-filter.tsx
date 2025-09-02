import { useState, useEffect, useRef } from 'react';
import { Filter, X, ChevronDown } from 'lucide-react';
import { Button } from './button';
import { CategoryChip } from './category-chip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from './dropdown-menu';
import { CUISINE_REGIONS } from '@/lib/cuisines';

export interface CuisineFilterProps {
  selectedCuisines: readonly string[];
  onCuisinesChange: (cuisines: string[]) => void;
  availableCuisines?: readonly string[];
  placeholder?: string;
  className?: string;
}

export function CuisineFilter({
  selectedCuisines,
  onCuisinesChange,
  placeholder = 'Filter by cuisine...',
  className = '',
}: CuisineFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      // Small delay to ensure dropdown is fully rendered
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Filter cuisines based on search term
  const filteredRegions = Object.entries(CUISINE_REGIONS).reduce(
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

  const toggleCuisine = (cuisine: string) => {
    if (selectedCuisines.includes(cuisine)) {
      onCuisinesChange(selectedCuisines.filter((c) => c !== cuisine));
    } else {
      onCuisinesChange([...selectedCuisines, cuisine]);
    }
  };

  const clearAllFilters = () => {
    onCuisinesChange([]);
  };

  return (
    <div className={`relative ${className}`}>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="justify-start">
            <Filter className="mr-2 h-4 w-4" />
            Cuisine
            {selectedCuisines.length > 0 && (
              <span className="ml-1 badge badge-primary badge-xs">
                {selectedCuisines.length}
              </span>
            )}
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-80 p-4">
          <div className="space-y-4">
            {/* Search input */}
            <div className="form-control">
              <input
                ref={searchInputRef}
                type="text"
                placeholder={placeholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input input-bordered input-sm"
              />
            </div>

            {/* Selected cuisines */}
            {selectedCuisines.length > 0 && (
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
                  {selectedCuisines.map((cuisine, index) => (
                    <CategoryChip
                      key={`selected-${cuisine}-${index}`}
                      category={cuisine}
                      variant="selected"
                      size="sm"
                      onClick={() => toggleCuisine(cuisine)}
                      onRemove={() => toggleCuisine(cuisine)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Available cuisines grouped by region */}
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {Object.entries(filteredRegions).map(([region, data]) => (
                <div key={region} className="space-y-2">
                  <h4 className="text-xs font-semibold text-base-content opacity-70 uppercase tracking-wide">
                    {region}
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {data.cuisines.map((cuisine) => (
                      <CategoryChip
                        key={cuisine}
                        category={cuisine}
                        variant={
                          selectedCuisines.includes(cuisine)
                            ? 'selected'
                            : 'clickable'
                        }
                        size="sm"
                        onClick={() => toggleCuisine(cuisine)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {Object.keys(filteredRegions).length === 0 && (
              <div className="text-center py-4">
                <p className="text-sm text-base-content opacity-50">
                  No cuisines found
                </p>
              </div>
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
