import React from 'react';

interface TagToggleGroupProps {
  children: React.ReactNode;
  className?: string;
}

export const TagToggleGroup: React.FC<TagToggleGroupProps> = React.memo(
  ({ children, className = '' }) => {
    return (
      <div className={`flex flex-wrap gap-2 ${className}`}>{children}</div>
    );
  }
);

TagToggleGroup.displayName = 'TagToggleGroup';
