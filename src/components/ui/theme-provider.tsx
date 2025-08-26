import { useEffect } from 'react';
import {
  applyCaramellatteTheme,
  initializeTheme,
  THEME_NAME,
} from '@/lib/theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Force apply Caramellatte theme immediately
    initializeTheme(THEME_NAME, true);

    // Also call the debug version for extra logging
    applyCaramellatteTheme();

    // Force a re-render by updating the document
    document.documentElement.setAttribute('data-theme', THEME_NAME);

    console.log('ThemeProvider: Caramellatte theme should be applied');
    console.log(
      'Current data-theme:',
      document.documentElement.getAttribute('data-theme')
    );
  }, []);

  return <>{children}</>;
}
