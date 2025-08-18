/**
 * DaisyUI Text Wrapping Migration
 * 
 * Provides utility classes for fixing text overflow issues in DaisyUI components,
 * particularly for label-text-alt elements that can exceed container width.
 */

export const textWrappingClasses = {
  // Main container class that applies text wrapping to all label elements
  container: "min-h-screen bg-base-100 [&_.label-text-alt]:max-w-full [&_.label-text-alt]:overflow-hidden [&_.label-text-alt]:whitespace-normal [&_.label-text-alt]:break-words [&_.label]:max-w-full",
  
  // Individual utility classes for specific use cases
  labelTextAlt: "max-w-full overflow-hidden whitespace-normal break-words",
  label: "max-w-full",
  
  // Helper text class for consistent styling
  helperText: "text-base-content/60 whitespace-normal break-words",
} as const;

/**
 * CSS class names for text wrapping utilities
 */
export const TEXT_WRAPPING_CLASSES = {
  CONTAINER: textWrappingClasses.container,
  LABEL_TEXT_ALT: textWrappingClasses.labelTextAlt,
  LABEL: textWrappingClasses.label,
  HELPER_TEXT: textWrappingClasses.helperText,
} as const;

/**
 * Apply text wrapping classes to a container element
 * @param baseClasses - Base CSS classes for the container
 * @returns Combined classes with text wrapping utilities
 */
export function withTextWrapping(baseClasses: string = ""): string {
  return `${baseClasses} ${textWrappingClasses.container}`.trim();
}

/**
 * Get helper text classes for consistent styling
 * @returns CSS classes for helper text elements
 */
export function getHelperTextClasses(): string {
  return textWrappingClasses.helperText;
}
