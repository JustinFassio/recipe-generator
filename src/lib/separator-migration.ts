import { cn } from '@/lib/utils';

const SEPARATOR_ORIENTATION_MAP = {
  horizontal: 'divider',
  vertical: 'divider divider-horizontal',
} as const;

export function createDaisyUISeparatorClasses(
  orientation: keyof typeof SEPARATOR_ORIENTATION_MAP = 'horizontal',
  className?: string
): string {
  const baseClasses = SEPARATOR_ORIENTATION_MAP[orientation];
  return cn(baseClasses, className);
}

export const separatorOrientationMap = SEPARATOR_ORIENTATION_MAP;
export type SeparatorOrientation = keyof typeof SEPARATOR_ORIENTATION_MAP;
