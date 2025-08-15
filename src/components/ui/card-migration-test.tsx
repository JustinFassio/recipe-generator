import React from 'react';
import {
  createDaisyUICardClasses,
  createDaisyUICardTitleClasses,
  createDaisyUICardFooterClasses,
  CardMigrationProps,
} from '@/lib/card-migration';

export const CardMigrationTest: React.FC<CardMigrationProps> = ({
  variant = 'bordered',
  children,
  className,
  ...props
}) => {
  const daisyUIClasses = createDaisyUICardClasses(variant, className);

  return (
    <div className={`${daisyUIClasses} bg-base-100 shadow-xl`} {...props}>
      {children}
    </div>
  );
};

export const CardMigrationDemo: React.FC = () => {
  const variants: Array<{ name: string; variant: string }> = [
    { name: 'Bordered', variant: 'bordered' },
    { name: 'Compact', variant: 'compact' },
    { name: 'Normal', variant: 'normal' },
    { name: 'Side', variant: 'side' },
    { name: 'Image Full', variant: 'image-full' },
  ];

  return (
    <div className="space-y-8 p-6">
      <h2 className="text-2xl font-bold">Card Migration Test</h2>

      {/* Simple Card Test */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Simple Card Test</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="card-bordered card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title">Simple Bordered Card</h2>
              <p>This is a simple DaisyUI card with borders.</p>
            </div>
          </div>

          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title">Simple Card (No Borders)</h2>
              <p>This is a simple DaisyUI card without borders.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Card Variants</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {variants.map(({ name, variant }) => {
            const daisyUIClasses = createDaisyUICardClasses(variant);
            return (
              <div key={variant} className="space-y-2">
                <CardMigrationTest
                  variant={variant as CardMigrationProps['variant']}
                >
                  <div className="card-body">
                    <h3 className={createDaisyUICardTitleClasses()}>
                      {name} Card
                    </h3>
                    <p className="text-sm opacity-70">
                      This is a {name.toLowerCase()} card variant
                    </p>
                    <p>
                      Card content goes here. This demonstrates the{' '}
                      {name.toLowerCase()} styling.
                    </p>
                    <div className={createDaisyUICardFooterClasses()}>
                      <button className="btn btn-primary btn-sm">Action</button>
                    </div>
                  </div>
                </CardMigrationTest>
                <div className="rounded bg-gray-100 p-2 text-xs">
                  <strong>Classes:</strong> {daisyUIClasses}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Card with Image</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <CardMigrationTest variant="image-full" className="w-96">
            <figure>
              <img
                src="https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop"
                alt="Pizza"
                className="h-48 w-full object-cover"
              />
            </figure>
            <div className="card-body">
              <h3 className={createDaisyUICardTitleClasses()}>Pizza Recipe</h3>
              <p className="text-sm opacity-70">Delicious homemade pizza</p>
              <p>
                Learn how to make the perfect pizza at home with this easy
                recipe.
              </p>
              <div className={createDaisyUICardFooterClasses()}>
                <button className="btn btn-primary btn-sm">View Recipe</button>
              </div>
            </div>
          </CardMigrationTest>

          <CardMigrationTest variant="side" className="w-96">
            <figure>
              <img
                src="https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=200&h=200&fit=crop"
                alt="Pizza"
                className="h-32 w-32 object-cover"
              />
            </figure>
            <div className="card-body">
              <h3 className={createDaisyUICardTitleClasses()}>Side Card</h3>
              <p className="text-sm opacity-70">Card with side image</p>
              <p>This card has an image on the side.</p>
              <div className={createDaisyUICardFooterClasses()}>
                <button className="btn btn-outline btn-sm">Details</button>
              </div>
            </div>
          </CardMigrationTest>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Interactive Test</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <CardMigrationTest
            variant="bordered"
            className="cursor-pointer transition-shadow hover:shadow-lg"
            onClick={() => alert('Card clicked!')}
          >
            <div className="card-body">
              <h3 className={createDaisyUICardTitleClasses()}>
                Clickable Card
              </h3>
              <p className="text-sm opacity-70">Click me to test interaction</p>
              <p>This card is clickable and has hover effects.</p>
            </div>
          </CardMigrationTest>

          <CardMigrationTest variant="compact">
            <div className="card-body">
              <h3 className={createDaisyUICardTitleClasses()}>Compact Card</h3>
              <p className="text-sm opacity-70">Takes up less space</p>
              <p>Perfect for lists and compact layouts.</p>
              <div className={createDaisyUICardFooterClasses()}>
                <button className="btn btn-ghost btn-sm">More</button>
                <button className="btn btn-primary btn-sm">Action</button>
              </div>
            </div>
          </CardMigrationTest>
        </div>
      </div>
    </div>
  );
};
