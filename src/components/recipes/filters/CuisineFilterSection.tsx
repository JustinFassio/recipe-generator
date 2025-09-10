import type { Cuisine } from '@/lib/types';

interface CuisineFilterSectionProps {
  selectedCuisines: Cuisine[];
  onCuisinesChange: (cuisines: Cuisine[]) => void;
  variant: 'dropdown' | 'accordion' | 'drawer';
  className?: string;
}

export function CuisineFilterSection({
  selectedCuisines,
  variant,
  className = '',
}: CuisineFilterSectionProps) {
  // Placeholder implementation - will be completed in PR 2
  return (
    <div className={`cuisine-filter-${variant} ${className}`}>
      <div className="p-2 border rounded text-sm text-gray-500">
        CuisineFilterSection ({variant}) - {selectedCuisines.length} selected
      </div>
    </div>
  );
}
