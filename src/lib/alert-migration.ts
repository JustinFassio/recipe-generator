import { cn } from '@/lib/utils';

const ALERT_VARIANT_MAP = {
  default: 'alert',
  destructive: 'alert alert-error',
} as const;

export function createDaisyUIAlertClasses(
  variant: keyof typeof ALERT_VARIANT_MAP = 'default',
  className?: string
): string {
  const baseClasses = ALERT_VARIANT_MAP[variant];
  return cn(baseClasses, className);
}

export function createDaisyUIAlertTitleClasses(className?: string): string {
  return cn('alert-title', className);
}

export function createDaisyUIAlertDescriptionClasses(
  className?: string
): string {
  return cn('alert-text', className);
}

export const alertVariantMap = ALERT_VARIANT_MAP;
export type AlertVariant = keyof typeof ALERT_VARIANT_MAP;
