import { InputMigrationShowcase } from '@/components/ui/input-migration-test';

export function InputMigrationTestPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-teal-50">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">
            DaisyUI Input Migration Test
          </h1>
          <p className="text-gray-600">
            Testing the migration from shadcn/ui Input components to DaisyUI
            input classes
          </p>
        </div>

        <InputMigrationShowcase />
      </div>
    </div>
  );
}
