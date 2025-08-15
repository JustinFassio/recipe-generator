/**
 * Tabs Migration Utilities
 *
 * This file provides utility functions for migrating from shadcn/ui Tabs component
 * to DaisyUI tabs classes. It maintains type safety and provides consistent
 * migration patterns across the application.
 */

import { cn } from '@/lib/utils';

/**
 * Tabs size mapping for DaisyUI
 * Maps common sizes to DaisyUI tabs classes
 */
const TABS_SIZE_MAP = {
  xs: 'tabs-xs',
  sm: 'tabs-sm',
  md: 'tabs-md',
  lg: 'tabs-lg',
} as const;

/**
 * Tabs variant mapping for DaisyUI
 * Maps common variants to DaisyUI tabs classes
 */
const TABS_VARIANT_MAP = {
  default: 'tabs',
  bordered: 'tabs-bordered',
  lifted: 'tabs-lifted',
  boxed: 'tabs-boxed',
} as const;

/**
 * Creates DaisyUI tabs classes based on variant and size
 *
 * @param variant - The tabs variant (default, bordered, lifted, boxed)
 * @param size - The tabs size (xs, sm, md, lg)
 * @param className - Additional CSS classes to apply
 * @returns DaisyUI tabs classes
 */
export function createDaisyUITabsClasses(
  variant: keyof typeof TABS_VARIANT_MAP = 'default',
  size: keyof typeof TABS_SIZE_MAP = 'md',
  className?: string
): string {
  const variantClasses = TABS_VARIANT_MAP[variant];
  const sizeClasses = TABS_SIZE_MAP[size];

  return cn(variantClasses, sizeClasses, className);
}

/**
 * Creates DaisyUI tab classes
 *
 * @param className - Additional CSS classes to apply
 * @returns DaisyUI tab classes
 */
export function createDaisyUITabClasses(className?: string): string {
  const baseClasses = 'tab';
  return cn(baseClasses, className);
}

/**
 * Creates DaisyUI tab content classes
 *
 * @param className - Additional CSS classes to apply
 * @returns DaisyUI tab content classes
 */
export function createDaisyUITabContentClasses(className?: string): string {
  const baseClasses = 'tab-content';
  return cn(baseClasses, className);
}

/**
 * Tabs size mapping for DaisyUI
 * Maps shadcn/ui sizes to DaisyUI equivalents
 */
export const tabsSizeMap = TABS_SIZE_MAP;

/**
 * Tabs variant mapping for DaisyUI
 * Maps shadcn/ui variants to DaisyUI equivalents
 */
export const tabsVariantMap = TABS_VARIANT_MAP;

/**
 * Type for tabs sizes
 */
export type TabsSize = keyof typeof TABS_SIZE_MAP;

/**
 * Type for tabs variants
 */
export type TabsVariant = keyof typeof TABS_VARIANT_MAP;
