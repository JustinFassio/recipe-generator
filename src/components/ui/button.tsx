import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';

import { createDaisyUIButtonClasses } from '@/lib/button-migration';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | 'default'
    | 'destructive'
    | 'outline'
    | 'secondary'
    | 'ghost'
    | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';

    // Use the migration utility to ensure DaisyUI classes are applied
    const daisyUIClasses = createDaisyUIButtonClasses(
      variant || 'default',
      size || 'default',
      className
    );

    return <Comp className={daisyUIClasses} ref={ref} {...props} />;
  }
);
Button.displayName = 'Button';

export { Button };
