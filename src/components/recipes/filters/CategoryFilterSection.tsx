interface CategoryFilterSectionProps {
  selectedCategories: string[];
  onCategoriesChange: (categories: string[]) => void;
  variant: 'dropdown' | 'accordion' | 'drawer';
  className?: string;
}

export function CategoryFilterSection({
  selectedCategories,
  variant,
  className = '',
}: CategoryFilterSectionProps) {
  // Placeholder implementation - will be completed in PR 2
  return (
    <div className={`category-filter-${variant} ${className}`}>
      <div className="p-2 border rounded text-sm text-gray-500">
        CategoryFilterSection ({variant}) - {selectedCategories.length} selected
      </div>
    </div>
  );
}
