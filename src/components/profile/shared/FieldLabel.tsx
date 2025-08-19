import React from 'react';

interface FieldLabelProps {
  children: React.ReactNode;
  className?: string;
  htmlFor?: string;
}

export const FieldLabel: React.FC<FieldLabelProps> = ({
  children,
  className = '',
  htmlFor,
}) => {
  return (
    <label className={`label ${className}`} htmlFor={htmlFor}>
      <span className="label-text">{children}</span>
    </label>
  );
};
