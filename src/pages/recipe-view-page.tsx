import { useParams, useNavigate } from 'react-router-dom';
import { useRecipe, usePublicRecipe } from '@/hooks/use-recipes';
import { RecipeView } from '@/components/recipes/recipe-view';
import { createDaisyUICardClasses } from '@/lib/card-migration';
import { createDaisyUISkeletonClasses } from '@/lib/skeleton-migration';
import { ChefHat } from 'lucide-react';

export function RecipeViewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Try to fetch as user recipe first
  const {
    data: userRecipe,
    isLoading: userLoading,
    error: userError,
  } = useRecipe(id!);

  // Only fetch public recipe if user recipe has finished loading and failed
  const shouldFetchPublic = !userLoading && !userRecipe && !!userError;
  const {
    data: publicRecipe,
    isLoading: publicLoading,
    error: publicError,
  } = usePublicRecipe(id!, { enabled: shouldFetchPublic });

  // Use whichever one succeeds
  const recipe = userRecipe || publicRecipe;
  // isLoading is true only if at least one query is loading and no data has been found yet
  const isLoading = (userLoading || publicLoading) && !recipe;
  // error if both queries have failed or neither query has returned data
  const error =
    !userLoading && !publicLoading && !recipe
      ? userError || publicError || new Error('Recipe not found')
      : null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-teal-50">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="space-y-6">
            <div className={createDaisyUISkeletonClasses('h-10 w-48')} />
            <div className={createDaisyUICardClasses('bordered')}>
              <div className="card-body p-6">
                <div
                  className={createDaisyUISkeletonClasses('mb-4 h-64 w-full')}
                />
                <div
                  className={createDaisyUISkeletonClasses('mb-2 h-8 w-3/4')}
                />
                <div className={createDaisyUISkeletonClasses('h-4 w-1/2')} />
              </div>
            </div>
            <div className={createDaisyUICardClasses('bordered')}>
              <div className="card-body space-y-4 p-6">
                <div className={createDaisyUISkeletonClasses('h-6 w-32')} />
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className={createDaisyUISkeletonClasses('h-4 w-full')}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !recipe) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-teal-50 p-4">
        <div className="mx-auto max-w-2xl pt-20">
          <div
            className={`${createDaisyUICardClasses('bordered')} p-8 text-center`}
          >
            <div className="card-body">
              <ChefHat className="mx-auto mb-4 h-12 w-12 text-red-400" />
              <h2 className="mb-2 text-xl font-semibold">Recipe not found</h2>
              <p className="mb-4 text-gray-600">
                The recipe you're looking for doesn't exist or has been deleted.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleEdit = () => {
    navigate('/add', { state: { recipe } });
  };

  const handleBack = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-teal-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <RecipeView recipe={recipe} onEdit={handleEdit} onBack={handleBack} />
      </div>
    </div>
  );
}
