import React from 'react';

interface TagToggleGroupProps {
  children: React.ReactNode;
  className?: string;
  'aria-label'?: string;
  'aria-describedby'?: string;
  role?: string;
}

export const TagToggleGroup: React.FC<TagToggleGroupProps> = ({
  children,
  className = '',
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedby,
  role = 'group',
}) => {
  return (
    <div
      className={`flex flex-wrap gap-2 ${className}`}
      role={role}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedby}
    >
      {children}
    </div>
  );
};
