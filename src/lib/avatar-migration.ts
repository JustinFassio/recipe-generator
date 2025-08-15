/**
 * Avatar Migration Utilities
 *
 * This file provides utility functions for migrating from shadcn/ui Avatar component
 * to DaisyUI avatar classes. It maintains type safety and provides consistent
 * migration patterns across the application.
 */

import { cn } from '@/lib/utils';

/**
 * Avatar size mapping for DaisyUI
 * Maps common sizes to DaisyUI avatar classes
 */
const AVATAR_SIZE_MAP = {
  xs: 'avatar-xs',
  sm: 'avatar-sm',
  md: 'avatar-md',
  lg: 'avatar-lg',
  xl: 'avatar-xl',
} as const;

/**
 * Creates DaisyUI avatar classes based on size
 *
 * @param size - The avatar size (xs, sm, md, lg, xl)
 * @param className - Additional CSS classes to apply
 * @returns DaisyUI avatar classes
 */
export function createDaisyUIAvatarClasses(
  size: keyof typeof AVATAR_SIZE_MAP = 'md',
  className?: string
): string {
  const baseClasses = 'avatar';
  return cn(baseClasses, AVATAR_SIZE_MAP[size], className);
}

/**
 * Creates DaisyUI avatar image classes
 *
 * @param className - Additional CSS classes to apply
 * @returns DaisyUI avatar image classes
 */
export function createDaisyUIAvatarImageClasses(className?: string): string {
  const baseClasses = 'avatar-img';
  return cn(baseClasses, className);
}

/**
 * Creates DaisyUI avatar placeholder classes
 *
 * @param className - Additional CSS classes to apply
 * @returns DaisyUI avatar placeholder classes
 */
export function createDaisyUIAvatarPlaceholderClasses(
  className?: string
): string {
  const baseClasses = 'avatar-placeholder';
  return cn(baseClasses, className);
}

/**
 * Avatar size mapping for DaisyUI
 * Maps shadcn/ui sizes to DaisyUI equivalents
 */
export const avatarSizeMap = AVATAR_SIZE_MAP;

/**
 * Type for avatar sizes
 */
export type AvatarSize = keyof typeof AVATAR_SIZE_MAP;
