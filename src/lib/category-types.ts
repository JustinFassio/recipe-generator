/**
 * Category type guards and utilities
 * Provides runtime validation and utility functions for category handling
 */

import { MAX_CATEGORY_LENGTH } from './constants';

// Type guards for category validation
export function isValidCategory(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    value.length <= MAX_CATEGORY_LENGTH &&
    /^[a-zA-Z0-9\s:,-]+$/.test(value)
  );
}

export function isNamespacedCategory(category: string): boolean {
  return category.includes(':') && category.split(':').length === 2;
}

export function parseCategory(category: string): {
  namespace?: string;
  value: string;
} {
  if (isNamespacedCategory(category)) {
    const [namespace, value] = category.split(':').map((s) => s.trim());
    return { namespace, value };
  }
  return { value: category.trim() };
}

export function formatCategory(namespace: string, value: string): string {
  return `${namespace.trim()}: ${value.trim()}`;
}

// Category array utilities
export function uniqueCategories(categories: string[]): string[] {
  return Array.from(new Set(categories.filter(Boolean)));
}

export function sortCategories(categories: string[]): string[] {
  return categories.sort((a, b) => {
    const aHasNamespace = isNamespacedCategory(a);
    const bHasNamespace = isNamespacedCategory(b);

    // Namespaced categories first
    if (aHasNamespace && !bHasNamespace) return -1;
    if (!aHasNamespace && bHasNamespace) return 1;

    // Alphabetical within groups
    return a.localeCompare(b);
  });
}

// Category validation utilities
export function validateCategory(category: string): boolean {
  if (!isValidCategory(category)) return false;

  // Check for valid namespace format if namespaced
  if (isNamespacedCategory(category)) {
    const { namespace, value } = parseCategory(category);
    return Boolean(
      namespace && value && namespace.length > 0 && value.length > 0
    );
  }

  // Reject categories with multiple colons that aren't properly namespaced
  if (category.includes(':') && !isNamespacedCategory(category)) {
    return false;
  }

  return true;
}

export function validateCategories(categories: string[]): {
  valid: string[];
  invalid: string[];
} {
  const valid: string[] = [];
  const invalid: string[] = [];

  categories.forEach((category) => {
    if (validateCategory(category)) {
      valid.push(category);
    } else {
      invalid.push(category);
    }
  });

  return { valid, invalid };
}

// Category filtering utilities
export function filterCategoriesByNamespace(
  categories: string[],
  namespace: string
): string[] {
  return categories.filter((category) => {
    if (!isNamespacedCategory(category)) return false;
    const parsed = parseCategory(category);
    return parsed.namespace?.toLowerCase() === namespace.toLowerCase();
  });
}

export function getCategoryNamespaces(categories: string[]): string[] {
  const namespaces = new Set<string>();

  categories.forEach((category) => {
    if (isNamespacedCategory(category)) {
      const parsed = parseCategory(category);
      if (parsed.namespace) {
        namespaces.add(parsed.namespace);
      }
    }
  });

  return Array.from(namespaces).sort();
}

// Category statistics utilities
export function getCategoryStats(categories: string[]): {
  total: number;
  namespaced: number;
  simple: number;
  namespaces: Record<string, number>;
} {
  const stats = {
    total: categories.length,
    namespaced: 0,
    simple: 0,
    namespaces: {} as Record<string, number>,
  };

  categories.forEach((category) => {
    if (isNamespacedCategory(category)) {
      stats.namespaced++;
      const parsed = parseCategory(category);
      if (parsed.namespace) {
        stats.namespaces[parsed.namespace] =
          (stats.namespaces[parsed.namespace] || 0) + 1;
      }
    } else {
      stats.simple++;
    }
  });

  return stats;
}

// Category transformation utilities
export function normalizeCategoryCase(category: string): string {
  if (!isNamespacedCategory(category)) {
    return category.trim();
  }

  const { namespace, value } = parseCategory(category);
  if (!namespace || !value) return category.trim();

  // Convert namespace and value to title case
  const titleCaseNamespace = namespace
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());

  const titleCaseValue = value
    .replace(/[_-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());

  return formatCategory(titleCaseNamespace, titleCaseValue);
}

export function normalizeCategories(categories: string[]): string[] {
  return categories
    .filter((category) => category != null && typeof category === 'string')
    .map((category) => normalizeCategoryCase(category))
    .filter(Boolean);
}

// Type definitions for category filtering
export interface CategoryFilter {
  namespace?: string;
  value?: string;
  categories?: string[];
}

export interface CategoryStats {
  total: number;
  namespaced: number;
  simple: number;
  namespaces: Record<string, number>;
}

export interface CategoryValidationResult {
  valid: string[];
  invalid: string[];
}
