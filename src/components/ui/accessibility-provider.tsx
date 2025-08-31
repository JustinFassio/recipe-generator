/**
 * AccessibilityProvider - Manages accessibility settings for older adults
 *
 * Currently:
 * - Theme is handled by ThemeProvider to prevent conflicts
 *
 * Future enhancements for 60+ users:
 * - Font size controls (small, medium, large, extra-large)
 * - High contrast options
 * - Reading mode preferences
 * - Touch target size adjustments
 */
export function AccessibilityProvider() {
  // Theme is now handled by ThemeProvider to prevent duplicate applications
  // TODO: Future font size initialization
  // const savedFontSize = localStorage.getItem('font-size') || 'medium';
  // applyFontSize(savedFontSize);

  // Currently renders nothing - future versions may render font size controls
  return null;
}

// Temporary export for backward compatibility during transition
export const ThemeToggle = AccessibilityProvider;
