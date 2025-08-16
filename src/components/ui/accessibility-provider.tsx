import { useEffect } from 'react';
import { initializeTheme, THEME_NAME } from '@/lib/theme';

/**
 * AccessibilityProvider - Manages accessibility settings for older adults
 * 
 * Currently:
 * - Ensures consistent caramellatte theme is applied
 * 
 * Future enhancements for 60+ users:
 * - Font size controls (small, medium, large, extra-large)
 * - High contrast options
 * - Reading mode preferences
 * - Touch target size adjustments
 */
export function AccessibilityProvider() {
  useEffect(() => {
    // Initialize theme using centralized utility
    initializeTheme(THEME_NAME);
    
    // TODO: Future font size initialization
    // const savedFontSize = localStorage.getItem('font-size') || 'medium';
    // applyFontSize(savedFontSize);
  }, []);

  // Currently renders nothing - future versions may render font size controls
  return null;
}

// Temporary export for backward compatibility during transition
export const ThemeToggle = AccessibilityProvider;
