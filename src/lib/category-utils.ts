export interface ParsedCategory {
  namespace: string;
  value: string;
  fullName: string;
}

/**
 * Parse a category string to extract namespace and value
 * @param category - The category string (e.g., "Cuisine: Italian", "Course: Main")
 * @returns Parsed category object
 */
export function parseCategory(category: string): ParsedCategory {
  const colonIndex = category.indexOf(':');

  if (colonIndex === -1) {
    // No namespace, treat as "Other"
    return {
      namespace: 'Other',
      value: category,
      fullName: category,
    };
  }

  const namespace = category.substring(0, colonIndex).trim();
  const value = category.substring(colonIndex + 1).trim();

  return {
    namespace,
    value,
    fullName: category,
  };
}

/**
 * Group categories by namespace
 * @param categories - Array of category strings
 * @returns Object with namespace as key and array of categories as value
 */
export function groupCategoriesByNamespace(
  categories: string[]
): Record<string, string[]> {
  return categories.reduce(
    (groups, category) => {
      const { namespace } = parseCategory(category);

      if (!groups[namespace]) {
        groups[namespace] = [];
      }

      groups[namespace].push(category);
      return groups;
    },
    {} as Record<string, string[]>
  );
}

/**
 * Check if a category matches a search term
 * @param category - The category string
 * @param searchTerm - The search term
 * @returns True if the category matches the search term
 */
export function categoryMatchesSearch(
  category: string,
  searchTerm: string
): boolean {
  const { namespace, value, fullName } = parseCategory(category);
  const lowerSearchTerm = searchTerm.toLowerCase();

  return (
    namespace.toLowerCase().includes(lowerSearchTerm) ||
    value.toLowerCase().includes(lowerSearchTerm) ||
    fullName.toLowerCase().includes(lowerSearchTerm)
  );
}
