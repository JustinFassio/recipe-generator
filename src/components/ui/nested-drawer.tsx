import { ReactNode } from 'react';
import { ChevronLeft } from 'lucide-react';
import { Button } from './button';

interface NestedDrawerProps {
  id: string;
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  showBackButton?: boolean;
  onBack?: () => void;
  backButtonText?: string;
  className?: string;
}

export function NestedDrawer({
  id,
  isOpen,
  onClose,
  title,
  children,
  showBackButton = false,
  onBack,
  backButtonText = 'Back',
  className = '',
}: NestedDrawerProps) {
  return (
    <div className="drawer">
      <input
        id={id}
        type="checkbox"
        className="drawer-toggle"
        checked={isOpen}
        onChange={(e) => {
          if (!e.target.checked) {
            onClose();
          }
        }}
      />

      <div className="drawer-content">
        {/* This will be the main page content */}
      </div>

      <div className="drawer-side">
        <label
          htmlFor={id}
          aria-label="close sidebar"
          className="drawer-overlay"
        ></label>

        <div
          className={`menu p-4 w-80 min-h-full bg-base-100 text-base-content ${className}`}
        >
          {/* Header */}
          <div className="mb-6 border-b pb-4">
            {showBackButton && onBack && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="p-0 h-auto mb-2"
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                {backButtonText}
              </Button>
            )}
            <h3 className="text-lg font-semibold">{title}</h3>
          </div>

          {/* Content */}
          <div className="flex-1">{children}</div>
        </div>
      </div>
    </div>
  );
}

interface DrawerTriggerProps {
  id: string;
  children: ReactNode;
  className?: string;
}

export function DrawerTrigger({
  id,
  children,
  className = '',
}: DrawerTriggerProps) {
  return (
    <label htmlFor={id} className={`cursor-pointer ${className}`}>
      {children}
    </label>
  );
}
