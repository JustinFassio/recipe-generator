import { useEffect } from 'react';
import { initializeTheme, THEME_NAME } from '@/lib/theme';

export function ThemeToggle() {
  useEffect(() => {
    // Always set to caramellatte theme using centralized utility
    initializeTheme(THEME_NAME);
  }, []);

  // This component now just ensures caramellatte theme is always applied
  return null; // Return null to hide the toggle completely
}
