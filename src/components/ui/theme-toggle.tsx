import { useEffect } from 'react';

export function ThemeToggle() {
  useEffect(() => {
    // Always set to caramellatte theme
    document.documentElement.setAttribute('data-theme', 'caramellatte');
    localStorage.setItem('theme', 'caramellatte');
  }, []);

  // This component now just ensures caramellatte theme is always applied
  return null; // Return null to hide the toggle completely
}
