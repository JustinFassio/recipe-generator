import React from 'react';
import { SectionCard } from '@/components/profile/shared';
import { Shield } from 'lucide-react';

interface SafetySectionProps {
  children: React.ReactNode;
  className?: string;
}

export const SafetySection: React.FC<SafetySectionProps> = ({
  children,
  className = '',
}) => {
  return (
    <SectionCard className={className}>
      <h2 className="card-title flex items-center">
        <Shield className="mr-2 h-5 w-5 text-warning" />
        Safety & Dietary
      </h2>
      <p className="text-base-content/60 mb-4 text-sm">
        Help us keep you safe by sharing any allergies or dietary restrictions.
        This information will be used to filter recipes and provide warnings
        when needed.
      </p>
      {children}
    </SectionCard>
  );
};
