interface GroceryCardProps {
  ingredient: string;
  category: string;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  isSelected: boolean;
  onToggle: (category: string, ingredient: string) => void;
}

/**
 * Reusable grocery card component for individual ingredients in the user's personal collection.
 * Shows availability toggle (Available/Unavailable) and handles the ingredient state.
 * Works exactly like the original inline JSX implementation.
 */
export function GroceryCard({
  ingredient,
  category,
  loading = false,
  disabled = false,
  className = '',
  isSelected,
  onToggle,
}: GroceryCardProps) {
  const handleToggle = () => {
    // Simple toggle - exactly like original inline JSX
    onToggle(category, ingredient);
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading || disabled}
      className={`btn btn-sm ${
        isSelected ? 'btn-primary' : 'btn-outline btn-ghost'
      } ${className}`}
      title={
        isSelected
          ? 'Available - you have this'
          : 'Unavailable - you need to buy this'
      }
    >
      {ingredient}
    </button>
  );
}
