# 🎨 Adding Custom DaisyUI Themes

This guide shows you how to add custom themes like "Caramellatte" to your Recipe Generator project.

## ⚠️ Important: DaisyUI Version Compatibility

**This project uses DaisyUI 4**, not DaisyUI 5. The configuration formats are different:

### DaisyUI 4 (Current Project) ✅

```javascript
// tailwind.config.js
daisyui: {
  themes: [
    {
      caramellatte: {
        primary: '#3d2817',      // Dark brown (was black)
        secondary: '#6b4423',    // Medium brown
        accent: '#8b5a2b',       // Lighter brown
        neutral: '#5d4037',      // Rich brown
        'base-100': '#fef7ed',   // Cream background
        'base-200': '#f5e6d3',   // Medium cream
        'base-300': '#e7d5c4',   // Light cream
        'base-content': '#3d2817', // Dark brown text
        'primary-content': '#ffffff', // White text on primary
        'secondary-content': '#e7d5c4', // Light text on secondary
        'accent-content': '#e7d5c4', // Light text on accent
        'neutral-content': '#fef7ed', // Light text on neutral
        info: '#3abff8',
        'info-content': '#e7d5c4',
        success: '#36d399',
        'success-content': '#e7d5c4',
        warning: '#fbbd23',
        'warning-content': '#3d2817',
        error: '#f87272',
        'error-content': '#3d2817',
      },
    },
  ];
}
```

### DaisyUI 5 (Not Compatible) ❌

```css
/* This format won't work in this project */
@plugin "daisyui/theme" {
  name: 'caramellatte';
  --color-primary: oklch(0% 0 0);
  --color-secondary: oklch(22.45% 0.075 37.85);
  /* ... */
}
```

**If you have DaisyUI 5 CSS, convert it to DaisyUI 4 format using the steps below.**

## Quick Start: Adding a Custom Theme

### Step 1: Define the Theme Colors

Edit `tailwind.config.js` and add your theme to the `daisyui.themes` array:

```javascript
daisyui: {
  themes: [
    {
      // Your existing themes...
      caramellatte: {
        primary: '#3d2817',      // Dark brown (was black)
        secondary: '#6b4423',    // Medium brown
        accent: '#8b5a2b',       // Lighter brown
        neutral: '#5d4037',      // Rich brown
        'base-100': '#fef7ed',   // Cream background
        'base-200': '#f5e6d3',   // Medium cream
        'base-300': '#e7d5c4',   // Light cream
        'base-content': '#3d2817', // Dark brown text
        'primary-content': '#ffffff', // White text on primary
        'secondary-content': '#e7d5c4', // Light text on secondary
        'accent-content': '#e7d5c4', // Light text on accent
        'neutral-content': '#fef7ed', // Light text on neutral
        info: '#3abff8',         // Blue
        'info-content': '#e7d5c4',
        success: '#36d399',      // Green
        'success-content': '#e7d5c4',
        warning: '#fbbd23',      // Yellow
        'warning-content': '#3d2817',
        error: '#f87272',        // Red
        'error-content': '#3d2817',
      },
    },
    // Built-in themes...
  ],
}
```

### Step 2: Add to Theme Toggle

Edit `src/components/ui/theme-toggle.tsx`:

```javascript
// Add to quick themes (for fast switching)
const quickThemes = ['light', 'dark', 'recipeGenerator', 'caramellatte'];

// Add to all themes (for full cycling)
const allThemes = [
  'recipeGenerator',
  'recipeWarm',
  'recipeCool',
  'recipeEarthy',
  'caramellatte', // ← Add here
  'light',
  'dark',
  // ... other themes
];
```

### Step 3: Test Your Theme

1. Run `npm run build` to ensure no errors
2. Click the theme toggle to cycle through themes
3. Your new theme should appear in the rotation

## Converting DaisyUI 5 CSS to DaisyUI 4

If you have DaisyUI 5 CSS like this:

```css
@plugin "daisyui/theme" {
  name: 'caramellatte';
  --color-primary: oklch(0% 0 0);
  --color-secondary: oklch(22.45% 0.075 37.85);
  --color-accent: oklch(46.44% 0.111 37.85);
  --color-base-100: oklch(98% 0.016 73.684);
  --color-base-content: oklch(40% 0.123 38.172);
}
```

Convert it to DaisyUI 4 format:

```javascript
caramellatte: {
  primary: '#000000',        // Convert oklch(0% 0 0) to hex
  secondary: '#3d2817',      // Convert oklch(22.45% 0.075 37.85) to hex
  accent: '#92400e',         // Convert oklch(46.44% 0.111 37.85) to hex
  'base-100': '#fef7ed',     // Convert oklch(98% 0.016 73.684) to hex
  'base-content': '#3d2817', // Convert oklch(40% 0.123 38.172) to hex
}
```

### Color Conversion Tools

- Use [OKLCH to Hex Converter](https://oklch.com/)
- Or use browser dev tools to convert colors
- DaisyUI 5 uses OKLCH, DaisyUI 4 uses hex colors

## Theme Color Guidelines

### Essential Colors (Required)

```javascript
{
  themeName: {
    primary: '#color',        // Main brand color
    secondary: '#color',      // Secondary brand color
    accent: '#color',         // Accent/highlight color
    neutral: '#color',        // Neutral/gray colors
    'base-100': '#color',     // Background color
    info: '#color',           // Info messages
    success: '#color',        // Success messages
    warning: '#color',        // Warning messages
    error: '#color',          // Error messages
  }
}
```

### Optional Advanced Colors

```javascript
{
  themeName: {
    // Standard colors...
    primary: '#color',

    // Advanced customization
    'primary-focus': '#color',      // Focus state
    'primary-content': '#color',    // Text on primary
    'secondary-focus': '#color',    // Focus state
    'secondary-content': '#color',  // Text on secondary

    // Component-specific
    'btn-primary': '#color',
    'btn-primary-hover': '#color',
    'card-bg': '#color',
    'card-border': '#color',
  }
}
```

## Popular Theme Color Palettes

### Coffee & Latte Themes

**Caramellatte** (Current theme):

```javascript
caramellatte: {
  primary: '#3d2817',      // Dark brown (was black)
  secondary: '#6b4423',    // Medium brown
  accent: '#8b5a2b',       // Lighter brown
  neutral: '#5d4037',      // Rich brown
  'base-100': '#fef7ed',   // Cream background
  'base-200': '#f5e6d3',   // Medium cream
  'base-300': '#e7d5c4',   // Light cream
  'base-content': '#3d2817', // Dark brown text
  'primary-content': '#ffffff', // White text on primary
  'secondary-content': '#e7d5c4', // Light text on secondary
  'accent-content': '#e7d5c4', // Light text on accent
  'neutral-content': '#fef7ed', // Light text on neutral
  info: '#3abff8',
  'info-content': '#e7d5c4',
  success: '#36d399',
  'success-content': '#e7d5c4',
  warning: '#fbbd23',
  'warning-content': '#3d2817',
  error: '#f87272',
  'error-content': '#3d2817',
}
```

**Mocha**:

```javascript
mocha: {
  primary: '#8b4513',      // Saddle brown
  secondary: '#654321',    // Dark brown
  accent: '#d2691e',       // Chocolate
  neutral: '#2f1b14',      // Very dark brown
  'base-100': '#f5f5dc',   // Beige
  info: '#3abff8',
  success: '#36d399',
  warning: '#fbbd23',
  error: '#f87272',
}
```

**Espresso**:

```javascript
espresso: {
  primary: '#3e2723',      // Dark brown
  secondary: '#5d4037',    // Brown grey
  accent: '#8d6e63',       // Brown
  neutral: '#1b1b1b',      // Almost black
  'base-100': '#fafafa',   // Off white
  info: '#3abff8',
  success: '#36d399',
  warning: '#fbbd23',
  error: '#f87272',
}
```

### Food & Kitchen Themes

**Spice Cabinet**:

```javascript
spiceCabinet: {
  primary: '#dc2626',      // Red pepper
  secondary: '#ea580c',    // Orange spice
  accent: '#f59e0b',       // Turmeric
  neutral: '#374151',      // Charcoal
  'base-100': '#fefefe',   // Clean white
  info: '#3abff8',
  success: '#36d399',
  warning: '#fbbd23',
  error: '#f87272',
}
```

**Fresh Herbs**:

```javascript
freshHerbs: {
  primary: '#059669',      // Sage green
  secondary: '#10b981',    // Mint green
  accent: '#84cc16',       // Lime green
  neutral: '#374151',
  'base-100': '#f0fdf4',   // Light green tint
  info: '#3abff8',
  success: '#36d399',
  warning: '#fbbd23',
  error: '#f87272',
}
```

## Using DaisyUI Theme Generator

1. **Visit**: [DaisyUI Theme Generator](https://daisyui.com/theme-generator/)
2. **Customize**: Use the visual editor to create your theme
3. **Export**: Copy the generated theme object
4. **Paste**: Add it to your `tailwind.config.js`

## Testing Your Theme

### Manual Testing

```javascript
// Set theme programmatically
document.documentElement.setAttribute('data-theme', 'yourThemeName');

// Check current theme
console.log(document.documentElement.getAttribute('data-theme'));
```

### Visual Testing Checklist

- [ ] Primary buttons look good
- [ ] Secondary buttons are readable
- [ ] Text has sufficient contrast
- [ ] Cards and backgrounds work well
- [ ] Error/success messages are visible
- [ ] Forms are readable
- [ ] Navigation elements are clear

## Troubleshooting

### Theme Not Appearing

1. Check theme name spelling in both config files
2. Ensure theme is in both `quickThemes` and `allThemes` arrays
3. Clear localStorage: `localStorage.removeItem('theme')`
4. Refresh the page

### Colors Not Updating

1. Verify hex color format: `#RRGGBB`
2. Check for CSS specificity conflicts
3. Ensure DaisyUI is properly configured
4. **Check for conflicting CSS custom properties** in `src/index.css`
5. Rebuild the project: `npm run build`

**Important**: If buttons appear black despite updating the DaisyUI theme, check that the CSS custom properties in `src/index.css` match your theme colors. The CSS variables can override the DaisyUI theme system.

### Build Errors

1. Check JSON syntax in `tailwind.config.js`
2. Verify all color values are valid hex codes
3. Ensure theme object structure is correct
4. Check for missing commas or brackets

### DaisyUI 5 CSS Issues

1. **Don't use DaisyUI 5 CSS syntax** in this project
2. Convert OKLCH colors to hex format
3. Use the DaisyUI 4 configuration format
4. Ensure you're editing `tailwind.config.js`, not CSS files

## Best Practices

1. **Naming**: Use descriptive, lowercase names (e.g., `caramellatte`, `spiceCabinet`)
2. **Colors**: Ensure sufficient contrast for accessibility
3. **Testing**: Test themes in both light and dark contexts
4. **Documentation**: Add theme descriptions to your docs
5. **Organization**: Group related themes together in the config
6. **Version**: Always use DaisyUI 4 format for this project

## Example: Complete Theme Addition

Here's a complete example of adding a "Sunset Kitchen" theme:

### 1. Add to `tailwind.config.js`:

```javascript
sunsetKitchen: {
  primary: '#f97316',      // Orange
  secondary: '#dc2626',    // Red
  accent: '#f59e0b',       // Amber
  neutral: '#374151',      // Gray
  'base-100': '#fef7ed',   // Warm white
  info: '#3abff8',
  success: '#36d399',
  warning: '#fbbd23',
  error: '#f87272',
}
```

### 2. Add to `theme-toggle.tsx`:

```javascript
const quickThemes = ['light', 'dark', 'recipeGenerator', 'caramellatte', 'sunsetKitchen'];
const allThemes = ['recipeGenerator', 'caramellatte', 'sunsetKitchen', 'light', 'dark', ...];
```

### 3. Test:

```bash
npm run build
```

That's it! Your new theme is now available in the theme toggle. 🎨
