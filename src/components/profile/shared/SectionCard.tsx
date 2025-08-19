import React from 'react';

interface SectionCardProps {
  children: React.ReactNode;
  className?: string;
}

export const SectionCard: React.FC<SectionCardProps> = ({
  children,
  className = '',
}) => {
  return (
    <div className={`card bg-base-200 shadow-lg ${className}`}>
      <div className="card-body">{children}</div>
    </div>
  );
};
