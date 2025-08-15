import React from 'react';
import { createDaisyUIInputClasses } from '@/lib/input-migration';

interface InputMigrationTestProps {
  variant?:
    | 'default'
    | 'bordered'
    | 'ghost'
    | 'primary'
    | 'secondary'
    | 'accent'
    | 'info'
    | 'success'
    | 'warning'
    | 'error';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  placeholder?: string;
  type?: string;
  disabled?: boolean;
  className?: string;
}

export const InputMigrationTest: React.FC<InputMigrationTestProps> = ({
  variant = 'default',
  size = 'md',
  placeholder = 'Enter text...',
  type = 'text',
  disabled = false,
  className,
  ...props
}) => {
  const daisyUIClasses = createDaisyUIInputClasses(variant, size, className);

  return (
    <input
      type={type}
      className={daisyUIClasses}
      placeholder={placeholder}
      disabled={disabled}
      {...props}
    />
  );
};

// Test component to showcase all input variants and sizes
export const InputMigrationShowcase: React.FC = () => {
  return (
    <div className="space-y-6 p-6">
      <h2 className="text-2xl font-bold">DaisyUI Input Migration Test</h2>

      {/* Input Variants */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Input Variants</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Bordered Input (Default)
            </label>
            <input
              className={createDaisyUIInputClasses('bordered')}
              placeholder="Bordered Input"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Ghost Input</label>
            <input
              className={createDaisyUIInputClasses('ghost')}
              placeholder="Ghost Input"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Primary Input</label>
            <input
              className={createDaisyUIInputClasses('primary')}
              placeholder="Primary Input"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Secondary Input</label>
            <input
              className={createDaisyUIInputClasses('secondary')}
              placeholder="Secondary Input"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Error Input</label>
            <input
              className={createDaisyUIInputClasses('error')}
              placeholder="Error Input"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Success Input</label>
            <input
              className={createDaisyUIInputClasses('success')}
              placeholder="Success Input"
            />
          </div>
        </div>
      </div>

      {/* Input Sizes */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Input Sizes</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Extra Small (xs)</label>
            <input
              className={createDaisyUIInputClasses('bordered', 'xs')}
              placeholder="Extra Small Input"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Small (sm)</label>
            <input
              className={createDaisyUIInputClasses('bordered', 'sm')}
              placeholder="Small Input"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Medium (md) - Default</label>
            <input
              className={createDaisyUIInputClasses('bordered', 'md')}
              placeholder="Medium Input"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Large (lg)</label>
            <input
              className={createDaisyUIInputClasses('bordered', 'lg')}
              placeholder="Large Input"
            />
          </div>
        </div>
      </div>

      {/* Input Types */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Input Types</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Text Input</label>
            <input
              type="text"
              className={createDaisyUIInputClasses('bordered')}
              placeholder="Text input"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Email Input</label>
            <input
              type="email"
              className={createDaisyUIInputClasses('bordered')}
              placeholder="email@example.com"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Password Input</label>
            <input
              type="password"
              className={createDaisyUIInputClasses('bordered')}
              placeholder="Password"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Number Input</label>
            <input
              type="number"
              className={createDaisyUIInputClasses('bordered')}
              placeholder="123"
            />
          </div>
        </div>
      </div>

      {/* Input States */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Input States</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Normal Input</label>
            <input
              className={createDaisyUIInputClasses('bordered')}
              placeholder="Normal state"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Disabled Input</label>
            <input
              className={createDaisyUIInputClasses('bordered')}
              placeholder="Disabled state"
              disabled
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Readonly Input</label>
            <input
              className={createDaisyUIInputClasses('bordered')}
              value="Readonly value"
              readOnly
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Required Input</label>
            <input
              className={createDaisyUIInputClasses('bordered')}
              placeholder="Required field"
              required
            />
          </div>
        </div>
      </div>

      {/* Real-world Examples */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Real-world Examples</h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Search Input (with icon)
            </label>
            <div className="relative">
              <input
                className={`${createDaisyUIInputClasses('bordered')} pl-10`}
                placeholder="Search recipes..."
              />
              <svg
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Form Input with Error</label>
            <input
              className={createDaisyUIInputClasses('error')}
              placeholder="Invalid email"
              value="invalid-email"
            />
            <p className="text-xs text-red-500">
              Please enter a valid email address
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Form Input with Success
            </label>
            <input
              className={createDaisyUIInputClasses('success')}
              placeholder="Valid input"
              value="valid@email.com"
            />
            <p className="text-xs text-green-500">Email looks good!</p>
          </div>
        </div>
      </div>
    </div>
  );
};
