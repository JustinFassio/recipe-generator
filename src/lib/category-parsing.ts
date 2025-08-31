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
 * Normalizes category data from various AI response formats into a consistent string array.
 *
 * @param input - Category data in one of the following formats:
 *   - string[]: Array of category strings (e.g., ["Course: Main", "Cuisine: Italian"])
 *   - string: Single category string (e.g., "Course: Main")
 *   - object: Namespace-based object (e.g., { course: ["Main"], cuisine: ["Italian"] })
 *   - null/undefined: Returns empty array
 *
 * @returns Array of normalized category strings in "Namespace: Value" format
 *
 * @example
 * // Array input
 * normalizeCategories(["Course: Main", "Cuisine: Italian"])
 * // Returns: ["Course: Main", "Cuisine: Italian"]
 *
 * // Object input
 * normalizeCategories({ course: ["Main"], cuisine: ["Italian"] })
 * // Returns: ["Course: Main", "Cuisine: Italian"]
 *
 * // String input
 * normalizeCategories("Course: Main")
 * // Returns: ["Course: Main"]
 *
 * // Null/undefined input
 * normalizeCategories(null)
 * // Returns: []
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
 * Converts object-format categories to normalized namespaced strings.
 *
 * @param input - Object with namespace keys and string/array values
 * @returns Array of normalized category strings in "Namespace: Value" format
 *
 * @example
 * normalizeObjectCategories({
 *   course: ["Main", "Appetizer"],
 *   cuisine: ["Italian"]
 * })
 * // Returns: ["Course: Main", "Course: Appetizer", "Cuisine: Italian"]
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
 * Normalizes a single category string to consistent format.
 *
 * @param category - Category string to normalize
 * @returns Normalized category string in "Namespace: Value" format, or empty string if invalid
 *
 * @example
 * normalizeCategory("course: main")     // Returns: "Course: Main"
 * normalizeCategory("italian cuisine")  // Returns: "Italian Cuisine"
 * normalizeCategory("")                 // Returns: ""
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
 * Converts a string to title case with special handling for category formatting.
 *
 * @param str - String to convert to title case
 * @returns Title-cased string with underscores/hyphens converted to spaces
 *
 * @example
 * toTitleCase("main_course")    // Returns: "Main Course"
 * toTitleCase("italian-cuisine") // Returns: "Italian Cuisine"
 * toTitleCase("dessert")        // Returns: "Dessert"
 */
function toTitleCase(str: string): string {
  return str
    .replace(/[_-]/g, ' ') // Replace underscores/hyphens with spaces
    .replace(/\s+/g, ' ') // Collapse multiple spaces
    .trim() // Remove leading/trailing spaces
    .replace(/\b\w/g, (char) => char.toUpperCase()); // Capitalize first letter of each word
}

/**
 * Validates a category string for proper format and content.
 *
 * @param category - Category string to validate
 * @returns true if category is valid, false otherwise
 *
 * @example
 * validateCategory("Course: Main")        // Returns: true
 * validateCategory("Italian Cuisine")     // Returns: true
 * validateCategory("")                    // Returns: false
 * validateCategory("Course:")             // Returns: false (missing value)
 * validateCategory("a".repeat(101))       // Returns: false (too long)
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
 * Extracts unique, valid categories from an array of category strings.
 *
 * @param categories - Array of category strings to process
 * @returns Array of unique, normalized, and validated category strings
 *
 * @example
 * uniqueValidCategories([
 *   "Course: Main",
 *   "Course: Main",     // Duplicate
 *   "invalid category", // Invalid
 *   "Cuisine: Italian"
 * ])
 * // Returns: ["Course: Main", "Cuisine: Italian"]
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
 * Sorts categories by namespace priority and alphabetically within each namespace.
 *
 * @param categories - Array of category strings to sort
 * @returns Sorted array of category strings
 *
 * @example
 * sortCategories([
 *   "Cuisine: Italian",
 *   "Course: Main",
 *   "Course: Appetizer",
 *   "Beverage: Wine"
 * ])
 * // Returns: ["Course: Appetizer", "Course: Main", "Beverage: Wine", "Cuisine: Italian"]
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
 * Parses a category string into its namespace and value components.
 *
 * @param category - Category string to parse
 * @returns Object with namespace (optional) and value properties
 *
 * @example
 * parseCategory("Course: Main")     // Returns: { namespace: "Course", value: "Main" }
 * parseCategory("Italian Cuisine")  // Returns: { value: "Italian Cuisine" }
 * parseCategory("")                 // Returns: { value: "" }
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
 * Formats a namespace and value into a properly formatted category string.
 *
 * @param namespace - Category namespace
 * @param value - Category value
 * @returns Formatted category string in "Namespace: Value" format
 *
 * @example
 * formatCategory("Course", "Main")     // Returns: "Course: Main"
 * formatCategory("Cuisine", "Italian") // Returns: "Cuisine: Italian"
 * formatCategory("", "Dessert")        // Returns: "Dessert"
 * formatCategory("Course", "")         // Returns: ""
 */
export function formatCategory(namespace: string, value: string): string {
  if (!namespace || !value) return value || '';
  return `${namespace.trim()}: ${value.trim()}`;
}
