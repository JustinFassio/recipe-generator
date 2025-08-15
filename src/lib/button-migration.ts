/**
 * Button Migration Utility
 *
 * Maps shadcn/ui Button component variants and sizes to DaisyUI equivalents
 * Used during the phased migration from shadcn/ui to DaisyUI buttons
 */

export const mapButtonVariant = (variant?: string): string => {
  switch (variant) {
    case 'default':
      return 'btn btn-primary';
    case 'destructive':
      return 'btn btn-error';
    case 'outline':
      return 'btn btn-outline';
    case 'secondary':
      return 'btn btn-secondary';
    case 'ghost':
      return 'btn btn-ghost';
    case 'link':
      return 'btn btn-link';
    default:
      return 'btn btn-primary';
  }
};

export const mapButtonSize = (size?: string): string => {
  switch (size) {
    case 'sm':
      return 'btn-sm';
    case 'lg':
      return 'btn-lg';
    case 'icon':
      return 'btn-circle';
    default:
      return '';
  }
};

export const createDaisyUIButtonClasses = (
  variant?: string,
  size?: string,
  className?: string
): string => {
  const variantClass = mapButtonVariant(variant);
  const sizeClass = mapButtonSize(size);
  const additionalClasses = className || '';

  return `${variantClass} ${sizeClass} ${additionalClasses}`.trim();
};

/**
 * Migration helper to convert shadcn/ui Button props to DaisyUI classes
 */
export const migrateButtonProps = (props: {
  variant?: string;
  size?: string;
  className?: string;
  [key: string]: unknown;
}) => {
  const { variant, size, className, ...restProps } = props;

  return {
    className: createDaisyUIButtonClasses(variant, size, className),
    ...restProps,
  };
};

/**
 * Type definitions for migration
 */
export interface ButtonMigrationProps {
  variant?:
    | 'default'
    | 'destructive'
    | 'outline'
    | 'secondary'
    | 'ghost'
    | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  [key: string]: unknown;
}
