/**
 * Label Migration Utilities
 *
 * This file provides utility functions for migrating from shadcn/ui Label component
 * to DaisyUI label classes. It maintains type safety and provides consistent
 * migration patterns across the application.
 */

import { cn } from '@/lib/utils';

/**
 * Label size mapping for DaisyUI
 * Maps common sizes to DaisyUI label classes
 */
const LABEL_SIZE_MAP = {
  xs: 'label-text-xs',
  sm: 'label-text-sm',
  md: 'label-text',
  lg: 'label-text-lg',
} as const;

/**
 * Creates DaisyUI label classes based on size
 *
 * @param size - The label size (xs, sm, md, lg)
 * @param className - Additional CSS classes to apply
 * @returns DaisyUI label classes
 */
export function createDaisyUILabelClasses(
  size: keyof typeof LABEL_SIZE_MAP = 'md',
  className?: string
): string {
  const baseClasses = 'label';
  const sizeClasses = LABEL_SIZE_MAP[size];

  return cn(baseClasses, sizeClasses, className);
}

/**
 * Creates DaisyUI label text classes
 *
 * @param size - The label text size (xs, sm, md, lg)
 * @param className - Additional CSS classes to apply
 * @returns DaisyUI label text classes
 */
export function createDaisyUILabelTextClasses(
  size: keyof typeof LABEL_SIZE_MAP = 'md',
  className?: string
): string {
  const sizeClasses = LABEL_SIZE_MAP[size];
  return cn(sizeClasses, className);
}

/**
 * Label size mapping for DaisyUI
 * Maps shadcn/ui sizes to DaisyUI equivalents
 */
export const labelSizeMap = LABEL_SIZE_MAP;

/**
 * Type for label sizes
 */
export type LabelSize = keyof typeof LABEL_SIZE_MAP;
