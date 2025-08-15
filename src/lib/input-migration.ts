/**
 * Input Migration Utility
 *
 * Maps shadcn/ui Input component to DaisyUI input classes
 * Used during the phased migration from shadcn/ui to DaisyUI inputs
 *
 * DaisyUI Input Classes:
 * - input: Basic input styling
 * - input-bordered: Adds border styling
 * - input-ghost: Subtle styling without borders
 * - input-primary: Primary color variant
 * - input-secondary: Secondary color variant
 * - input-accent: Accent color variant
 * - input-info: Info color variant
 * - input-success: Success color variant
 * - input-warning: Warning color variant
 * - input-error: Error color variant
 * - input-lg: Large size
 * - input-md: Medium size (default)
 * - input-sm: Small size
 * - input-xs: Extra small size
 */

export const createDaisyUIInputClasses = (
  variant?:
    | 'default'
    | 'bordered'
    | 'ghost'
    | 'primary'
    | 'secondary'
    | 'accent'
    | 'info'
    | 'success'
    | 'warning'
    | 'error',
  size?: 'xs' | 'sm' | 'md' | 'lg',
  className?: string
): string => {
  const baseClasses = 'input';

  // Map variant to DaisyUI classes
  const variantClasses =
    variant === 'default' || !variant ? 'input-bordered' : `input-${variant}`;

  // Map size to DaisyUI classes
  const sizeClasses = size === 'md' || !size ? '' : `input-${size}`;

  const additionalClasses = className || '';

  return `${baseClasses} ${variantClasses} ${sizeClasses} ${additionalClasses}`.trim();
};

/**
 * Helper function to create input classes with common patterns
 */
export const createInputClasses = {
  // Standard bordered input (most common)
  bordered: (size?: 'xs' | 'sm' | 'md' | 'lg', className?: string) =>
    createDaisyUIInputClasses('bordered', size, className),

  // Ghost input for subtle styling
  ghost: (size?: 'xs' | 'sm' | 'md' | 'lg', className?: string) =>
    createDaisyUIInputClasses('ghost', size, className),

  // Primary input for main actions
  primary: (size?: 'xs' | 'sm' | 'md' | 'lg', className?: string) =>
    createDaisyUIInputClasses('primary', size, className),

  // Error input for validation errors
  error: (size?: 'xs' | 'sm' | 'md' | 'lg', className?: string) =>
    createDaisyUIInputClasses('error', size, className),

  // Success input for validation success
  success: (size?: 'xs' | 'sm' | 'md' | 'lg', className?: string) =>
    createDaisyUIInputClasses('success', size, className),
};
