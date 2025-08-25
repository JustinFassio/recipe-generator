import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface FabMenuItem {
  id: string;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}

interface FloatingActionButtonProps {
  icon: React.ReactNode;
  items: FabMenuItem[];
  position?: 'bl' | 'br' | 'tl' | 'tr';
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  icon,
  items,
  position = 'bl',
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const positionClasses = {
    bl: 'bottom-4 left-4',
    br: 'bottom-4 right-4',
    tl: 'top-4 left-4',
    tr: 'top-4 right-4',
  };

  const handleButtonClick = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className={cn('fixed z-50', positionClasses[position])}>
      {/* Main FAB Button */}
      <button
        onClick={handleButtonClick}
        className={cn(
          'btn btn-circle btn-neutral h-14 w-14 shadow',
          isOpen && 'scale-105'
        )}
        aria-label="Open menu"
      >
        {icon}
      </button>

      {/* Menu Items */}
      {isOpen && (
        <div className="absolute bottom-full mb-2 flex flex-col gap-2">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                item.onClick();
                setIsOpen(false);
              }}
              className={`btn btn-sm whitespace-nowrap shadow-lg ${
                item.id === 'ai-create' ? 'btn-neutral' : 'btn-neutral'
              }`}
              aria-label={item.label}
            >
              {item.icon}
              <span className="ml-2">{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
