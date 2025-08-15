/**
 * Skeleton Migration Utility
 *
 * Maps shadcn/ui Skeleton component variants to DaisyUI equivalents
 * Used during the phased migration from shadcn/ui to DaisyUI skeletons
 *
 * IMPORTANT: DaisyUI skeletons have a different structure than shadcn/ui:
 *
 * shadcn/ui structure:
 * <Skeleton className="h-4 w-full" />
 *
 * DaisyUI structure:
 * <div className="skeleton h-4 w-full"></div>
 */

export const createDaisyUISkeletonClasses = (className?: string): string => {
  const baseClasses = 'skeleton';
  const additionalClasses = className || '';

  return `${baseClasses} ${additionalClasses}`.trim();
};

/**
 * Migration helper to convert shadcn/ui Skeleton props to DaisyUI classes
 */
export const migrateSkeletonProps = (props: {
  className?: string;
  [key: string]: unknown;
}) => {
  const { className, ...restProps } = props;

  return {
    className: createDaisyUISkeletonClasses(className),
    ...restProps,
  };
};

/**
 * Type definitions for skeleton migration
 */
export interface SkeletonMigrationProps {
  children?: React.ReactNode;
  className?: string;
  [key: string]: unknown;
}
