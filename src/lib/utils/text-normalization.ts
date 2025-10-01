/**
 * Shared text normalization utilities for consistent handling of accented characters
 * and other text processing across the application.
 */

/**
 * Normalizes text by removing accented characters and standardizing format.
 * This ensures consistent text processing across different parts of the application.
 * 
 * @param input - The text to normalize
 * @returns Normalized text with accented characters decomposed and diacritical marks removed
 */
export function normalizeAccentedCharacters(input: string): string {
  return input
    .normalize('NFKD') // Decompose accented characters
    .replace(/[\u0300-\u036f]/g, ''); // Remove diacritical marks
}

/**
 * Complete text normalization for ingredient matching.
 * Combines accented character normalization with additional processing.
 * 
 * @param input - The text to normalize
 * @returns Fully normalized text suitable for ingredient matching
 */
export function normalizeText(input: string): string {
  return normalizeAccentedCharacters(input)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ') // Replace non-alphanumeric with spaces
    .replace(/\s+/g, ' ') // Collapse multiple spaces
    .trim();
}
