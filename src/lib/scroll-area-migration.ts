import { cn } from '@/lib/utils';

const SCROLL_AREA_VARIANT_MAP = {
  default: 'overflow-auto',
  hidden: 'overflow-hidden',
  scroll: 'overflow-scroll',
} as const;

export function createDaisyUIScrollAreaClasses(
  variant: keyof typeof SCROLL_AREA_VARIANT_MAP = 'default',
  className?: string
): string {
  const baseClasses = SCROLL_AREA_VARIANT_MAP[variant];
  return cn('relative', baseClasses, className);
}

export function createDaisyUIScrollBarClasses(className?: string): string {
  return cn(
    'scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100',
    className
  );
}

export const scrollAreaVariantMap = SCROLL_AREA_VARIANT_MAP;
export type ScrollAreaVariant = keyof typeof SCROLL_AREA_VARIANT_MAP;
