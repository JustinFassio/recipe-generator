/**
 * Textarea Migration Utilities
 *
 * This file provides utility functions for migrating from shadcn/ui Textarea component
 * to DaisyUI textarea classes. It maintains type safety and provides consistent
 * migration patterns across the application.
 */

import { cn } from '@/lib/utils';

/**
 * Textarea size mapping for DaisyUI
 * Maps common sizes to DaisyUI textarea classes
 */
const TEXTAREA_SIZE_MAP = {
  xs: 'textarea-xs',
  sm: 'textarea-sm',
  md: 'textarea-md',
  lg: 'textarea-lg',
} as const;

/**
 * Textarea variant mapping for DaisyUI
 * Maps common variants to DaisyUI textarea classes
 */
const TEXTAREA_VARIANT_MAP = {
  default: 'textarea-bordered',
  bordered: 'textarea-bordered',
  ghost: 'textarea-ghost',
} as const;

/**
 * Creates DaisyUI textarea classes based on variant and size
 *
 * @param variant - The textarea variant (default, bordered, ghost)
 * @param size - The textarea size (xs, sm, md, lg)
 * @param className - Additional CSS classes to apply
 * @returns DaisyUI textarea classes
 */
export function createDaisyUITextareaClasses(
  variant: keyof typeof TEXTAREA_VARIANT_MAP = 'default',
  size: keyof typeof TEXTAREA_SIZE_MAP = 'md',
  className?: string
): string {
  const baseClasses = 'textarea';
  const variantClasses = TEXTAREA_VARIANT_MAP[variant];
  const sizeClasses = TEXTAREA_SIZE_MAP[size];

  return cn(baseClasses, variantClasses, sizeClasses, className);
}

/**
 * Textarea size mapping for DaisyUI
 * Maps shadcn/ui sizes to DaisyUI equivalents
 */
export const textareaSizeMap = TEXTAREA_SIZE_MAP;

/**
 * Textarea variant mapping for DaisyUI
 * Maps shadcn/ui variants to DaisyUI equivalents
 */
export const textareaVariantMap = TEXTAREA_VARIANT_MAP;

/**
 * Type for textarea sizes
 */
export type TextareaSize = keyof typeof TEXTAREA_SIZE_MAP;

/**
 * Type for textarea variants
 */
export type TextareaVariant = keyof typeof TEXTAREA_VARIANT_MAP;
