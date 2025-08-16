import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Initialize DaisyUI theme immediately
document.documentElement.setAttribute('data-theme', 'caramellatte');
localStorage.setItem('theme', 'caramellatte');

console.log(
  'Theme initialized in main.tsx:',
  document.documentElement.getAttribute('data-theme')
);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
