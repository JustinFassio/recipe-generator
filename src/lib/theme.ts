/**
 * Centralized theme management utility
 *
 * This module provides a single source of truth for theme initialization
 * and management across the application.
 */

export const THEME_NAME = 'caramellatte' as const;

/**
 * Initialize the DaisyUI theme by setting the data-theme attribute
 * and storing the theme preference in localStorage
 *
 * @param themeName - The theme to initialize (defaults to caramellatte)
 * @param debug - Whether to log debug information
 */
export function initializeTheme(
  themeName: string = THEME_NAME,
  debug: boolean = false
): void {
  // Set the theme on the document element
  document.documentElement.setAttribute('data-theme', themeName);

  // Store theme preference in localStorage for persistence
  localStorage.setItem('theme', themeName);

  if (debug) {
    console.log(`Theme initialized: ${themeName}`);
    console.log(
      'Current theme attribute:',
      document.documentElement.getAttribute('data-theme')
    );
    console.log('Stored theme preference:', localStorage.getItem('theme'));
  }
}

/**
 * Get the current active theme
 *
 * @returns The currently active theme name
 */
export function getCurrentTheme(): string | null {
  return document.documentElement.getAttribute('data-theme');
}

/**
 * Get the stored theme preference from localStorage
 *
 * @returns The stored theme preference or null if not set
 */
export function getStoredTheme(): string | null {
  return localStorage.getItem('theme');
}

/**
 * Apply the caramellatte theme with debug logging
 * This is a convenience function for the current fixed theme setup
 */
export function applyCaramellatteTheme(): void {
  initializeTheme(THEME_NAME, true);

  // Additional debug info for caramellatte theme
  console.log('Caramellatte theme applied globally');
  console.log(
    'Background color:',
    getComputedStyle(document.body).backgroundColor
  );
}

// ========================================
// FONT SIZE MANAGEMENT (Future Implementation)
// ========================================

export type FontSize = 'small' | 'medium' | 'large' | 'extra-large';

export const FONT_SIZE_CLASSES = {
  small: 'text-sm',
  medium: 'text-base', // Default
  large: 'text-lg',
  'extra-large': 'text-xl',
} as const;

/**
 * Future implementation for older adults (60+)
 * Apply font size settings across the application
 * 
 * @param fontSize - The font size to apply
 */
export function applyFontSize(fontSize: FontSize): void {
  // TODO: Implement font size application
  // This will be used by AccessibilityProvider in the future
  
  // Store preference
  localStorage.setItem('font-size', fontSize);
  
  // Apply CSS classes or CSS custom properties
  // document.documentElement.style.setProperty('--base-font-size', getFontSizeValue(fontSize));
  
  console.log(`Font size preference saved: ${fontSize}`);
}

/**
 * Get the stored font size preference
 * 
 * @returns The stored font size or default 'medium'
 */
export function getStoredFontSize(): FontSize {
  const stored = localStorage.getItem('font-size') as FontSize;
  return stored && Object.keys(FONT_SIZE_CLASSES).includes(stored) ? stored : 'medium';
}
