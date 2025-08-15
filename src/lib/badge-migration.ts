/**
 * Badge Migration Utilities
 *
 * This file provides utility functions for migrating from shadcn/ui Badge component
 * to DaisyUI badge classes. It maintains type safety and provides consistent
 * migration patterns across the application.
 */

import { cn } from '@/lib/utils';

/**
 * Badge variant mapping for DaisyUI
 * Maps shadcn/ui variants to DaisyUI equivalents
 * Single source of truth for badge variant mappings
 */
const BADGE_VARIANT_MAP = {
  default: 'badge-primary',
  secondary: 'badge-secondary',
  destructive: 'badge-error',
  outline: 'badge-outline',
} as const;

/**
 * Creates DaisyUI badge classes based on the variant
 *
 * @param variant - The badge variant (default, secondary, destructive, outline)
 * @param className - Additional CSS classes to apply
 * @returns DaisyUI badge classes
 */
export function createDaisyUIBadgeClasses(
  variant: keyof typeof BADGE_VARIANT_MAP = 'default',
  className?: string
): string {
  const baseClasses = 'badge badge-sm';
  return cn(baseClasses, BADGE_VARIANT_MAP[variant], className);
}

/**
 * Badge variant mapping for DaisyUI
 * Maps shadcn/ui variants to DaisyUI equivalents
 */
export const badgeVariantMap = BADGE_VARIANT_MAP;

/**
 * Type for badge variants
 */
export type BadgeVariant = keyof typeof BADGE_VARIANT_MAP;
