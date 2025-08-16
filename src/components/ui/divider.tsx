import * as React from 'react';
import { cn } from '@/lib/utils';

interface DividerProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical';
  children?: React.ReactNode;
}

const Divider = React.forwardRef<HTMLDivElement, DividerProps>(
  ({ className, orientation = 'horizontal', children, ...props }, ref) => {
    const baseClasses = 'divider';
    const orientationClasses =
      orientation === 'vertical' ? 'divider-vertical' : 'divider-horizontal';

    return (
      <div
        ref={ref}
        className={cn(baseClasses, orientationClasses, className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Divider.displayName = 'Divider';

export { Divider };
