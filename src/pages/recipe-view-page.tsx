import { useParams, useNavigate } from 'react-router-dom';
import { useRecipe } from '@/hooks/use-recipes';
import { RecipeView } from '@/components/recipes/recipe-view';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ChefHat } from 'lucide-react';

export function RecipeViewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: recipe, isLoading, error } = useRecipe(id!);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-teal-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            <Skeleton className="h-10 w-48" />
            <Card>
              <div className="p-6">
                <Skeleton className="h-64 w-full mb-4" />
                <Skeleton className="h-8 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </Card>
            <Card>
              <div className="p-6 space-y-4">
                <Skeleton className="h-6 w-32" />
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-4 w-full" />
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (error || !recipe) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-teal-50 p-4">
        <div className="max-w-2xl mx-auto pt-20">
          <Card className="text-center p-8">
            <CardContent>
              <ChefHat className="h-12 w-12 text-red-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Recipe not found</h2>
              <p className="text-gray-600 mb-4">
                The recipe you're looking for doesn't exist or has been deleted.
              </p>
            </CardContent>
          </Card>
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <RecipeView
          recipe={recipe}
          onEdit={handleEdit}
          onBack={handleBack}
        />
      </div>
    </div>
  );
}