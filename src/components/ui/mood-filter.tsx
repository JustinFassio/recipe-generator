import { useState, useRef, useEffect } from 'react';
import { Filter, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import CategoryChip from '@/components/ui/CategoryChip';
import { MOOD_REGIONS, MOOD_OPTIONS } from '@/lib/moods';

export interface MoodFilterProps {
  selectedMoods: readonly string[];
  onMoodsChange: (moods: string[]) => void;
  availableMoods?: readonly string[];
  placeholder?: string;
  className?: string;
}

export function MoodFilter({
  selectedMoods,
  onMoodsChange,
  availableMoods = MOOD_OPTIONS,
  placeholder = 'Select moods...',
  className = '',
}: MoodFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const toggleMood = (mood: string) => {
    if (selectedMoods.includes(mood)) {
      onMoodsChange(selectedMoods.filter(m => m !== mood));
    } else {
      onMoodsChange([...selectedMoods, mood]);
    }
  };

  const clearAllMoods = () => {
    onMoodsChange([]);
  };

  // Filter regions based on search term
  const filteredRegions = Object.entries(MOOD_REGIONS).filter(([, regionData]) => {
    const regionMoods = regionData.moods.filter(mood => 
      availableMoods.includes(mood) &&
      mood.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return regionMoods.length > 0;
  });

  return (
    <div className={`relative ${className}`}>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="justify-start">
          <Filter className="mr-2 h-4 w-4" />
          Mood
          {selectedMoods.length > 0 && (
            <span className="ml-1 badge badge-primary badge-xs">
              {selectedMoods.length}
            </span>
          )}
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-80 p-4">
        {/* Search Input */}
        <div className="mb-4">
          <Input
            ref={searchInputRef}
            placeholder={placeholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>

        {/* Selected Moods */}
        {selectedMoods.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium mb-2">Selected Moods</h4>
            <div className="flex flex-wrap gap-2">
              {selectedMoods.map((mood) => (
                <CategoryChip
                  key={mood}
                  category={mood}
                  onRemove={() => toggleMood(mood)}
                  variant="removable"
                />
              ))}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllMoods}
              className="mt-2 text-xs text-gray-500 hover:text-gray-700"
            >
              Clear All
            </Button>
          </div>
        )}

                {/* Available Moods by Region */}
        <div className="space-y-3 max-h-60 overflow-y-auto">
          {filteredRegions.map(([regionName, regionData]) => {
            const regionMoods = regionData.moods.filter(mood => 
              availableMoods.includes(mood) &&
              mood.toLowerCase().includes(searchTerm.toLowerCase())
            );

            if (regionMoods.length === 0) return null;

            return (
              <div key={regionName}>
                <h5 className="text-sm font-medium text-gray-700 mb-2">
                  {regionName}
                </h5>
                <p className="text-xs text-gray-500 mb-2">
                  {regionData.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {regionMoods.map((mood) => (
                    <CategoryChip
                      key={mood}
                      category={mood}
                      onClick={() => toggleMood(mood)}
                      variant={selectedMoods.includes(mood) ? "default" : "readonly"}
                      className="cursor-pointer hover:bg-gray-100"
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* No results message */}
        {filteredRegions.length === 0 && searchTerm && (
          <div className="text-center py-4 text-gray-500">
            <p>No moods found matching "{searchTerm}"</p>
          </div>
        )}
      </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
