# DaisyUI Integration Guide

**Complete guide to using DaisyUI components in the Recipe Generator**

---

## 🎯 **Overview**

DaisyUI is a component library for Tailwind CSS that provides semantic class names and pre-built components. This guide explains how DaisyUI is integrated into the Recipe Generator project and how to effectively use its components.

## 🔧 **Current Integration Setup**

### **1. Installation & Configuration**

DaisyUI is installed as a Tailwind CSS plugin and configured in `tailwind.config.js`:

```javascript
// tailwind.config.js
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [require('daisyui')],
  daisyui: {
    themes: [
      {
        recipeGenerator: {
          primary: '#16a34a', // Custom green theme
          secondary: '#f59e0b',
          accent: '#8b5cf6',
          neutral: '#3d4451',
          'base-100': '#ffffff',
          info: '#3abff8',
          success: '#36d399',
          warning: '#fbbd23',
          error: '#f87272',
        },
      },
      'light',
      'dark',
    ],
    darkTheme: 'dark',
    base: true,
    styled: true,
    utils: true,
    prefix: '',
    logs: true,
    themeRoot: ':root',
  },
};
```

### **2. CSS Integration**

DaisyUI styles are loaded through Tailwind CSS in `src/index.css`:

```css
@tailwind base; /* Includes DaisyUI base styles */
@tailwind components; /* Includes DaisyUI component styles */
@tailwind utilities; /* Includes DaisyUI utility classes */
```

### **3. Theme System**

The app includes a theme toggle that cycles through:

- **recipeGenerator** (custom green theme)
- **light** (default light theme)
- **dark** (default dark theme)

## 🎨 **Component Usage Patterns**

### **Semantic vs Utility Classes**

DaisyUI uses semantic class names instead of verbose utility classes:

```tsx
// ❌ Traditional Tailwind (verbose)
<button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:ring-2 focus:ring-blue-300 transition-colors">
  Click me
</button>

// ✅ DaisyUI (semantic)
<button className="btn btn-primary">
  Click me
</button>
```

### **Component Categories**

#### **1. Buttons**

```tsx
// Basic buttons
<button className="btn">Default</button>
<button className="btn btn-primary">Primary</button>
<button className="btn btn-secondary">Secondary</button>
<button className="btn btn-accent">Accent</button>

// Button variants
<button className="btn btn-outline">Outline</button>
<button className="btn btn-ghost">Ghost</button>
<button className="btn btn-link">Link</button>

// Button sizes
<button className="btn btn-xs">Extra Small</button>
<button className="btn btn-sm">Small</button>
<button className="btn">Normal</button>
<button className="btn btn-lg">Large</button>

// Button states
<button className="btn btn-primary" disabled>Disabled</button>
<button className="btn btn-primary loading">Loading</button>
```

#### **2. Cards**

```tsx
// Basic card
<div className="card bg-base-100 shadow-xl">
  <div className="card-body">
    <h2 className="card-title">Card Title</h2>
    <p>Card content goes here</p>
    <div className="card-actions justify-end">
      <button className="btn btn-primary">Action</button>
    </div>
  </div>
</div>

// Card with image
<div className="card w-96 bg-base-100 shadow-xl">
  <figure><img src="/recipe-image.jpg" alt="Recipe" /></figure>
  <div className="card-body">
    <h2 className="card-title">Recipe Name</h2>
    <p>Recipe description...</p>
    <div className="card-actions justify-end">
      <button className="btn btn-primary">View Recipe</button>
    </div>
  </div>
</div>
```

#### **3. Alerts**

```tsx
// Info alert
<div className="alert alert-info">
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
  </svg>
  <span>This is an info alert!</span>
</div>

// Success alert
<div className="alert alert-success">
  <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
  <span>Recipe saved successfully!</span>
</div>

// Warning alert
<div className="alert alert-warning">
  <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
  </svg>
  <span>Warning message here</span>
</div>

// Error alert
<div className="alert alert-error">
  <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
  <span>Error message here</span>
</div>
```

#### **4. Navigation**

```tsx
// Navbar
<div className="navbar bg-base-100">
  <div className="navbar-start">
    <div className="dropdown">
      <div tabIndex={0} role="button" className="btn btn-ghost lg:hidden">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h8m-8 6h16" />
        </svg>
      </div>
      <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52">
        <li><a>Home</a></li>
        <li><a>Recipes</a></li>
        <li><a>Chat</a></li>
      </ul>
    </div>
    <a className="btn btn-ghost text-xl">Recipe Generator</a>
  </div>
  <div className="navbar-center hidden lg:flex">
    <ul className="menu menu-horizontal px-1">
      <li><a>Home</a></li>
      <li><a>Recipes</a></li>
      <li><a>Chat</a></li>
    </ul>
  </div>
  <div className="navbar-end">
    <button className="btn">Get started</button>
  </div>
</div>

// Breadcrumb
<div className="text-sm breadcrumbs">
  <ul>
    <li><a>Home</a></li>
    <li><a>Recipes</a></li>
    <li>Pasta Carbonara</li>
  </ul>
</div>
```

#### **5. Forms**

```tsx
// Form control
<div className="form-control w-full max-w-xs">
  <label className="label">
    <span className="label-text">Recipe Title</span>
  </label>
  <input type="text" placeholder="Enter recipe title" className="input input-bordered" />
  <label className="label">
    <span className="label-text-alt">Alt label</span>
  </label>
</div>

// Textarea
<div className="form-control">
  <label className="label">
    <span className="label-text">Instructions</span>
  </label>
  <textarea className="textarea textarea-bordered h-24" placeholder="Enter cooking instructions"></textarea>
</div>

// Select
<div className="form-control w-full max-w-xs">
  <label className="label">
    <span className="label-text">Difficulty Level</span>
  </label>
  <select className="select select-bordered">
    <option disabled selected>Pick one</option>
    <option>Easy</option>
    <option>Medium</option>
    <option>Hard</option>
  </select>
</div>

// Checkbox
<div className="form-control">
  <label className="label cursor-pointer">
    <span className="label-text">Vegetarian</span>
    <input type="checkbox" className="checkbox checkbox-primary" />
  </label>
</div>

// Radio group
<div className="form-control">
  <label className="label cursor-pointer">
    <span className="label-text">Cuisine Type</span>
    <input type="radio" name="radio-10" className="radio radio-primary" />
  </label>
</div>
```

#### **6. Modals**

```tsx
// Basic modal
<dialog className="modal modal-open">
  <div className="modal-box">
    <h3 className="font-bold text-lg">Hello!</h3>
    <p className="py-4">Modal content here</p>
    <div className="modal-action">
      <button className="btn">Close</button>
    </div>
  </div>
</dialog>

// Modal with form
<dialog className="modal modal-open">
  <div className="modal-box">
    <h3 className="font-bold text-lg">Add Recipe</h3>
    <div className="form-control">
      <label className="label">
        <span className="label-text">Recipe Name</span>
      </label>
      <input type="text" placeholder="Recipe name" className="input input-bordered" />
    </div>
    <div className="modal-action">
      <button className="btn">Cancel</button>
      <button className="btn btn-primary">Save</button>
    </div>
  </div>
</dialog>
```

#### **7. Badges & Indicators**

```tsx
// Badges
<div className="badge badge-primary">New</div>
<div className="badge badge-secondary">Popular</div>
<div className="badge badge-accent">Featured</div>
<div className="badge badge-outline">Outline</div>

// Badge sizes
<div className="badge badge-xs">Extra Small</div>
<div className="badge badge-sm">Small</div>
<div className="badge">Normal</div>
<div className="badge badge-lg">Large</div>

// Indicators
<div className="indicator">
  <span className="indicator-item badge badge-secondary">new</span>
  <div className="grid w-32 h-32 bg-base-300 place-items-center">content</div>
</div>
```

#### **8. Progress & Loading**

```tsx
// Progress bars
<progress className="progress progress-primary w-full" value="70" max="100"></progress>
<progress className="progress progress-secondary w-full" value="50" max="100"></progress>
<progress className="progress progress-accent w-full" value="90" max="100"></progress>

// Loading spinners
<span className="loading loading-spinner loading-xs"></span>
<span className="loading loading-spinner loading-sm"></span>
<span className="loading loading-spinner loading-md"></span>
<span className="loading loading-spinner loading-lg"></span>

// Loading dots
<span className="loading loading-dots loading-lg"></span>
```

## 🔄 **Integration with Existing Components**

### **Current DaisyUI Usage in Recipe Generator**

#### **Header Component** (`src/components/layout/header.tsx`)

```tsx
// Using DaisyUI navbar
<header className="navbar bg-base-100 border-b shadow-sm">
  <div className="navbar-start">
    <ChefHat className="text-primary h-8 w-8" />
  </div>
  {/* ... other navbar content */}
</header>
```

#### **Theme Toggle**

```tsx
// Using DaisyUI button
<button className="btn btn-ghost btn-circle">
  <Moon className="h-5 w-5" />
</button>
```

### **Migration Strategy**

#### **Gradual Replacement**

You can gradually replace shadcn/ui components with DaisyUI equivalents:

```tsx
// Instead of shadcn/ui Button
<Button variant="default">Click me</Button>

// Use DaisyUI button
<button className="btn btn-primary">Click me</button>
```

#### **Component Mapping**

| shadcn/ui Component | DaisyUI Equivalent |
| ------------------- | ------------------ |
| `Button`            | `btn` classes      |
| `Card`              | `card` classes     |
| `Alert`             | `alert` classes    |
| `Input`             | `input` classes    |
| `Textarea`          | `textarea` classes |
| `Select`            | `select` classes   |
| `Checkbox`          | `checkbox` classes |
| `Radio`             | `radio` classes    |

## 🎨 **Theme Customization**

### **Custom Theme Colors**

Your `recipeGenerator` theme uses:

```css
{
  "primary": "#16a34a",    /* Green - main brand color */
  "secondary": "#f59e0b",  /* Orange - accent color */
  "accent": "#8b5cf6",     /* Purple - highlight color */
  "neutral": "#3d4451",    /* Gray - neutral color */
  "base-100": "#ffffff",   /* White - background */
  "info": "#3abff8",       /* Blue - info messages */
  "success": "#36d399",    /* Green - success messages */
  "warning": "#fbbd23",    /* Yellow - warning messages */
  "error": "#f87272",      /* Red - error messages */
}
```

### **Theme Switching**

```tsx
// Programmatic theme switching
const switchTheme = (theme: string) => {
  document.documentElement.setAttribute('data-theme', theme);
};

// Switch to custom theme
switchTheme('recipeGenerator');

// Switch to light theme
switchTheme('light');

// Switch to dark theme
switchTheme('dark');
```

## 🚀 **Best Practices**

### **1. Semantic Class Names**

```tsx
// ✅ Use semantic DaisyUI classes
<button className="btn btn-primary">Save Recipe</button>
<div className="alert alert-success">Recipe saved!</div>

// ❌ Avoid mixing with utility classes unnecessarily
<button className="btn btn-primary px-4 py-2 rounded-lg">Save Recipe</button>
```

### **2. Responsive Design**

```tsx
// DaisyUI components are responsive by default
<div className="card bg-base-100 lg:card-side shadow-xl">
  <figure>
    <img src="/recipe.jpg" alt="Recipe" />
  </figure>
  <div className="card-body">
    <h2 className="card-title">Recipe Name</h2>
    <p>Recipe description...</p>
  </div>
</div>
```

### **3. Accessibility**

```tsx
// DaisyUI components include accessibility features
<button className="btn btn-primary" aria-label="Save recipe">
  Save Recipe
</button>

<div className="alert alert-info" role="alert">
  <span>Information message</span>
</div>
```

### **4. State Management**

```tsx
// Loading states
<button className="btn btn-primary" disabled={isLoading}>
  {isLoading ? (
    <>
      <span className="loading loading-spinner loading-sm"></span>
      Saving...
    </>
  ) : (
    'Save Recipe'
  )}
</button>
```

## 📚 **Resources & Documentation**

### **Official Documentation**

- **DaisyUI Website**: https://daisyui.com/
- **Component Library**: https://daisyui.com/components/
- **Theme Generator**: https://daisyui.com/theme-generator/
- **GitHub Repository**: https://github.com/saadeghi/daisyui

### **Component Examples**

- **Button Examples**: https://daisyui.com/components/button/
- **Card Examples**: https://daisyui.com/components/card/
- **Form Examples**: https://daisyui.com/components/form/
- **Modal Examples**: https://daisyui.com/components/modal/

### **Theme Customization**

- **Color Palette**: https://daisyui.com/docs/colors/
- **Theme Configuration**: https://daisyui.com/docs/config/
- **CSS Variables**: https://daisyui.com/docs/css-variables/

## 🧪 **Testing DaisyUI Components**

### **Component Testing**

```tsx
// Test DaisyUI button rendering
import { render, screen } from '@testing-library/react';

test('renders DaisyUI button', () => {
  render(<button className="btn btn-primary">Test Button</button>);
  expect(screen.getByRole('button')).toHaveTextContent('Test Button');
});
```

### **Theme Testing**

```tsx
// Test theme switching
test('switches theme correctly', () => {
  document.documentElement.setAttribute('data-theme', 'recipeGenerator');
  expect(document.documentElement.getAttribute('data-theme')).toBe(
    'recipeGenerator'
  );
});
```

## 🔍 **Troubleshooting**

### **Common Issues**

#### **1. Components Not Styling**

```bash
# Check if DaisyUI is properly installed
npm list daisyui

# Verify Tailwind config includes DaisyUI plugin
# tailwind.config.js should have: plugins: [require('daisyui')]
```

#### **2. Theme Not Applying**

```tsx
// Ensure theme is set on document element
document.documentElement.setAttribute('data-theme', 'recipeGenerator');

// Check if theme is defined in config
// tailwind.config.js should include your theme in themes array
```

#### **3. CSS Conflicts**

```css
/* If you have conflicting styles, use more specific selectors */
.btn.btn-primary {
  /* Your custom styles */
}
```

---

**Next Steps**:

1. **Start with basic components** like buttons and cards
2. **Gradually replace existing components** with DaisyUI equivalents
3. **Customize the theme** to match your brand colors
4. **Test components** across different browsers and devices

For more advanced usage, consult the [DaisyUI documentation](https://daisyui.com/components/) and [theme customization guide](https://daisyui.com/docs/config/).
