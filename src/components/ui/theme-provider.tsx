import { useEffect } from 'react';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Apply Caramellatte theme globally
    document.documentElement.setAttribute('data-theme', 'caramellatte');
    localStorage.setItem('theme', 'caramellatte');

    // Also set it on the html element for good measure
    document.documentElement.setAttribute('data-theme', 'caramellatte');

    // Force a re-render by toggling the theme
    setTimeout(() => {
      document.documentElement.removeAttribute('data-theme');
      setTimeout(() => {
        document.documentElement.setAttribute('data-theme', 'caramellatte');
        console.log('Caramellatte theme applied globally');
        console.log(
          'Current theme:',
          document.documentElement.getAttribute('data-theme')
        );
        console.log(
          'Background color:',
          getComputedStyle(document.body).backgroundColor
        );
      }, 10);
    }, 10);
  }, []);

  return <>{children}</>;
}
