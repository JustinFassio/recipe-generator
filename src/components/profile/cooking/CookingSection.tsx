import React from 'react';
import { SectionCard } from '@/components/profile/shared';
import { ChefHat } from 'lucide-react';

interface CookingSectionProps {
  children: React.ReactNode;
  className?: string;
}

export const CookingSection: React.FC<CookingSectionProps> = ({
  children,
  className = '',
}) => {
  return (
    <SectionCard className={className}>
      <h2 className="card-title flex items-center">
        <ChefHat className="mr-2 h-5 w-5 text-primary" />
        Cooking Preferences
      </h2>
      <p className="text-base-content/60 mb-4 text-sm">
        Tell us about your cooking style and preferences for better recipe
        recommendations tailored to your taste and available equipment.
      </p>
      {children}
    </SectionCard>
  );
};
