/**
 * Badge Migration Utilities
 *
 * This file provides utility functions for migrating from shadcn/ui Badge component
 * to DaisyUI badge classes. It maintains type safety and provides consistent
 * migration patterns across the application.
 */

import { cn } from '@/lib/utils';

/**
 * Creates DaisyUI badge classes based on the variant
 *
 * @param variant - The badge variant (default, secondary, destructive, outline)
 * @param className - Additional CSS classes to apply
 * @returns DaisyUI badge classes
 */
export function createDaisyUIBadgeClasses(
  variant:
    | 'default'
    | 'secondary'
    | 'destructive'
    | 'outline'
    | 'warning' = 'default',
  className?: string
): string {
  const baseClasses = 'badge badge-sm';

  const variantClasses = {
    default: 'badge-primary',
    secondary: 'badge-secondary',
    destructive: 'badge-error',
    outline: 'badge-outline',
    warning: 'badge-warning',
  };

  return cn(baseClasses, variantClasses[variant], className);
}

/**
 * Badge variant mapping for DaisyUI
 * Maps shadcn/ui variants to DaisyUI equivalents
 */
export const badgeVariantMap = {
  default: 'badge-primary',
  secondary: 'badge-secondary',
  destructive: 'badge-error',
  outline: 'badge-outline',
  warning: 'badge-warning',
} as const;

/**
 * Type for badge variants
 */
export type BadgeVariant = keyof typeof badgeVariantMap;
