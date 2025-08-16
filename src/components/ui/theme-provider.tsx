import { useEffect } from 'react';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Apply Caramellatte theme globally
    document.documentElement.setAttribute('data-theme', 'caramellatte');
    localStorage.setItem('theme', 'caramellatte');

    // Log theme application for debugging
    console.log('Caramellatte theme applied globally');
    console.log(
      'Current theme:',
      document.documentElement.getAttribute('data-theme')
    );
    console.log(
      'Background color:',
      getComputedStyle(document.body).backgroundColor
    );
  }, []);

  return <>{children}</>;
}
