import { useEffect } from 'react';
import { initializeTheme, THEME_NAME } from '@/lib/theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Apply Caramellatte theme once on app initialization
    initializeTheme(THEME_NAME, false);
  }, []);

  return <>{children}</>;
}
