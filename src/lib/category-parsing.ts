/**
 * Category parsing and normalization utilities
 * Handles multiple input formats from AI responses
 */

// Types for different input formats
type CategoryInput =
  | string[] // ["Course: Main", "Cuisine: Italian"]
  | string // "Course: Main"
  | CategoryObject // { course: ["Main"], cuisine: ["Italian"] }
  | null
  | undefined;

interface CategoryObject {
  [namespace: string]: string | string[];
}

/**
 * Main normalization function - handles all input formats
 */
export function normalizeCategories(input: CategoryInput): string[] {
  if (!input) return [];

  try {
    // Case 1: Array of strings (most common)
    if (Array.isArray(input)) {
      return input
        .filter((item) => typeof item === 'string' && item.trim())
        .map((item) => normalizeCategory(item.trim()))
        .filter(Boolean);
    }

    // Case 2: Single string
    if (typeof input === 'string') {
      const trimmed = input.trim();
      return trimmed ? [normalizeCategory(trimmed)] : [];
    }

    // Case 3: Object format { namespace: [values] }
    if (typeof input === 'object' && input !== null) {
      return normalizeObjectCategories(input);
    }

    return [];
  } catch (error) {
    console.warn('Category normalization error:', error);
    return [];
  }
}

/**
 * Normalize object-format categories to namespaced strings
 */
function normalizeObjectCategories(input: CategoryObject): string[] {
  const result: string[] = [];

  // Define preferred namespace order for consistent output
  const namespaceOrder = [
    'course',
    'dish_type',
    'dishtype',
    'dish type',
    'component',
    'technique',
    'collection',
    'cuisine',
    'beverage',
    'occasion',
  ];

  // Get all namespaces, ordered by preference
  const allNamespaces = Object.keys(input);
  const orderedNamespaces = [
    ...namespaceOrder.filter((ns) => allNamespaces.includes(ns)),
    ...allNamespaces.filter((ns) => !namespaceOrder.includes(ns)),
  ];

  for (const namespace of orderedNamespaces) {
    const values = input[namespace];
    const normalizedNamespace = toTitleCase(namespace.replace(/[_-]/g, ' '));

    if (Array.isArray(values)) {
      values.forEach((value) => {
        if (typeof value === 'string' && value.trim()) {
          result.push(`${normalizedNamespace}: ${toTitleCase(value.trim())}`);
        }
      });
    } else if (typeof values === 'string' && values.trim()) {
      result.push(`${normalizedNamespace}: ${toTitleCase(values.trim())}`);
    }
  }

  return result;
}

/**
 * Normalize individual category string
 */
function normalizeCategory(category: string): string {
  if (!category || typeof category !== 'string') return '';

  const trimmed = category.trim();

  // Handle namespaced format "Namespace: Value"
  if (trimmed.includes(':')) {
    const parts = trimmed.split(':');
    if (parts.length === 2) {
      const namespace = toTitleCase(parts[0].trim());
      const value = toTitleCase(parts[1].trim());
      return `${namespace}: ${value}`;
    }
  }

  // Handle simple category
  return toTitleCase(trimmed);
}

/**
 * Convert string to title case with special handling
 */
function toTitleCase(str: string): string {
  return str
    .replace(/[_-]/g, ' ') // Replace underscores/hyphens with spaces
    .replace(/\s+/g, ' ') // Collapse multiple spaces
    .trim() // Remove leading/trailing spaces
    .replace(/\b\w/g, (char) => char.toUpperCase()); // Capitalize first letter of each word
}

/**
 * Validate category format and content
 */
export function validateCategory(category: string): boolean {
  if (!category || typeof category !== 'string') return false;

  const trimmed = category.trim();

  // Check length
  if (trimmed.length === 0 || trimmed.length > 100) return false;

  // Check for valid characters (letters, numbers, spaces, colons, commas, hyphens)
  if (!/^[a-zA-Z0-9\s:,-]+$/.test(trimmed)) return false;

  // If namespaced, validate format
  if (trimmed.includes(':')) {
    const parts = trimmed.split(':');
    if (parts.length !== 2) return false;
    if (!parts[0].trim() || !parts[1].trim()) return false;
  }

  return true;
}

/**
 * Extract unique, valid categories from array
 */
export function uniqueValidCategories(categories: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const category of categories) {
    const normalized = normalizeCategory(category);
    if (normalized && validateCategory(normalized) && !seen.has(normalized)) {
      seen.add(normalized);
      result.push(normalized);
    }
  }

  return result;
}

/**
 * Sort categories by namespace priority and alphabetically
 */
export function sortCategories(categories: string[]): string[] {
  const namespacePriority = [
    'Course',
    'Dish Type',
    'Component',
    'Technique',
    'Collection',
    'Cuisine',
    'Beverage',
    'Occasion',
  ];

  return categories.sort((a, b) => {
    const aNamespace = a.includes(':') ? a.split(':')[0].trim() : '';
    const bNamespace = b.includes(':') ? b.split(':')[0].trim() : '';

    const aPriority = namespacePriority.indexOf(aNamespace);
    const bPriority = namespacePriority.indexOf(bNamespace);

    // Sort by namespace priority first
    if (aPriority !== -1 && bPriority !== -1) {
      if (aPriority !== bPriority) return aPriority - bPriority;
    } else if (aPriority !== -1) {
      return -1;
    } else if (bPriority !== -1) {
      return 1;
    }

    // Then alphabetically
    return a.localeCompare(b);
  });
}

/**
 * Parse category string into namespace and value
 */
export function parseCategory(category: string): {
  namespace?: string;
  value: string;
} {
  if (!category || typeof category !== 'string') {
    return { value: '' };
  }

  const trimmed = category.trim();

  if (trimmed.includes(':')) {
    const [namespace, value] = trimmed.split(':').map((s) => s.trim());
    return { namespace, value };
  }

  return { value: trimmed };
}

/**
 * Format namespace and value into category string
 */
export function formatCategory(namespace: string, value: string): string {
  if (!namespace || !value) return value || '';
  return `${namespace.trim()}: ${value.trim()}`;
}
