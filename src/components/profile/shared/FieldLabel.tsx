import React from 'react';

interface FieldLabelProps {
  children: React.ReactNode;
  className?: string;
}

export const FieldLabel: React.FC<FieldLabelProps> = ({
  children,
  className = '',
}) => {
  return (
    <label className={`label ${className}`}>
      <span className="label-text">{children}</span>
    </label>
  );
};
