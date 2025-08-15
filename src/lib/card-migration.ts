/**
 * Card Migration Utility
 *
 * Maps shadcn/ui Card component variants to DaisyUI equivalents
 * Used during the phased migration from shadcn/ui to DaisyUI cards
 *
 * IMPORTANT: DaisyUI cards have a different structure than shadcn/ui:
 *
 * shadcn/ui structure:
 * <Card>
 *   <CardHeader>...</CardHeader>
 *   <CardContent>...</CardContent>
 *   <CardFooter>...</CardFooter>
 * </Card>
 *
 * DaisyUI structure:
 * <div class="card card-bordered">
 *   <div class="card-body">
 *     <h2 class="card-title">Title</h2>
 *     <p>Content</p>
 *     <div class="card-actions">
 *       <button>Action</button>
 *     </div>
 *   </div>
 * </div>
 */

export const createDaisyUICardClasses = (
  variant?: string,
  className?: string
): string => {
  const baseClasses = 'card';
  const variantClasses = mapCardVariant(variant);
  const additionalClasses = className || '';

  return `${baseClasses} ${variantClasses} ${additionalClasses}`.trim();
};

export const mapCardVariant = (variant?: string): string => {
  switch (variant) {
    case 'bordered':
      return 'card-bordered';
    case 'compact':
      return 'card-compact';
    case 'normal':
      return 'card-normal';
    case 'side':
      return 'card-side';
    case 'image-full':
      return 'card-image-full';
    default:
      return 'card-bordered'; // Default to bordered for consistency
  }
};

export const createDaisyUICardHeaderClasses = (className?: string): string => {
  // DaisyUI doesn't have a separate header - it's part of card-body
  const baseClasses = '';
  const additionalClasses = className || '';

  return `${baseClasses} ${additionalClasses}`.trim();
};

export const createDaisyUICardTitleClasses = (className?: string): string => {
  const baseClasses = 'card-title';
  const additionalClasses = className || '';

  return `${baseClasses} ${additionalClasses}`.trim();
};

export const createDaisyUICardContentClasses = (className?: string): string => {
  // DaisyUI content is part of card-body, not separate
  const baseClasses = '';
  const additionalClasses = className || '';

  return `${baseClasses} ${additionalClasses}`.trim();
};

export const createDaisyUICardFooterClasses = (className?: string): string => {
  const baseClasses = 'card-actions justify-end';
  const additionalClasses = className || '';

  return `${baseClasses} ${additionalClasses}`.trim();
};

/**
 * Migration helper to convert shadcn/ui Card props to DaisyUI classes
 */
export const migrateCardProps = (props: {
  variant?: string;
  className?: string;
  [key: string]: unknown;
}) => {
  const { variant, className, ...restProps } = props;

  return {
    className: createDaisyUICardClasses(variant, className),
    ...restProps,
  };
};

/**
 * Type definitions for card migration
 */
export interface CardMigrationProps {
  variant?: 'bordered' | 'compact' | 'normal' | 'side' | 'image-full';
  children: React.ReactNode;
  className?: string;
  [key: string]: unknown;
}
