import { useEffect } from 'react';
import { applyCaramellatteTheme } from '@/lib/theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Apply Caramellatte theme globally using centralized utility
    applyCaramellatteTheme();
  }, []);

  return <>{children}</>;
}
