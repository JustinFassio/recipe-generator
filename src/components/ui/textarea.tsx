import * as React from 'react';

import { createDaisyUITextareaClasses } from '@/lib/textarea-migration';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  variant?: 'default' | 'bordered' | 'ghost';
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, variant = 'default', size = 'md', ...props }, ref) => {
    const daisyUIClasses = createDaisyUITextareaClasses(
      variant,
      size,
      className
    );

    return <textarea className={daisyUIClasses} ref={ref} {...props} />;
  }
);
Textarea.displayName = 'Textarea';

export { Textarea };
