import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Clock, Users, Edit, Calendar } from 'lucide-react';
import type { Recipe } from '@/lib/supabase';

interface RecipeViewProps {
  recipe: Recipe;
  onEdit?: () => void;
  onBack?: () => void;
}

export function RecipeView({ recipe, onEdit, onBack }: RecipeViewProps) {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        {onBack && (
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Recipes
          </Button>
        )}
        {onEdit && (
          <Button onClick={onEdit}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Recipe
          </Button>
        )}
      </div>

      {/* Recipe Header */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
            {recipe.image_url && (
              <div className="lg:w-1/3">
                <img
                  src={recipe.image_url}
                  alt={recipe.title}
                  className="h-64 w-full rounded-lg object-cover lg:h-48"
                />
              </div>
            )}
            <div className="flex-1">
              <CardTitle className="mb-4 text-2xl font-bold lg:text-3xl">
                {recipe.title}
              </CardTitle>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center">
                  <Users className="mr-1 h-4 w-4" />
                  <Badge variant="secondary">
                    {recipe.ingredients.length} ingredients
                  </Badge>
                </div>
                <div className="flex items-center">
                  <Calendar className="mr-1 h-4 w-4" />
                  <span>
                    Added {new Date(recipe.created_at).toLocaleDateString()}
                  </span>
                </div>
                {recipe.updated_at !== recipe.created_at && (
                  <div className="flex items-center">
                    <Clock className="mr-1 h-4 w-4" />
                    <span>
                      Updated {new Date(recipe.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Ingredients */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Ingredients</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recipe.ingredients.map((ingredient, index) => (
              <div key={index} className="flex items-start">
                {ingredient.startsWith('---') && ingredient.endsWith('---') ? (
                  // Category header
                  <div className="w-full">
                    <Separator className="mb-2" />
                    <h4 className="mb-2 text-lg font-semibold text-gray-800">
                      {ingredient.replace(/^---\s*/, '').replace(/\s*---$/, '')}
                    </h4>
                  </div>
                ) : (
                  // Regular ingredient
                  <>
                    <div className="mr-3 mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-orange-100">
                      <div className="h-2 w-2 rounded-full bg-orange-500"></div>
                    </div>
                    <p className="leading-relaxed text-gray-700">
                      {ingredient}
                    </p>
                  </>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recipe.instructions.split('\n').map((line, index) => {
              const trimmedLine = line.trim();

              if (!trimmedLine) return null;

              // Check if it's a section header (starts with **)
              if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**')) {
                return (
                  <div key={index} className="mt-6 first:mt-0">
                    <Separator className="mb-3" />
                    <h4 className="text-lg font-semibold text-gray-800">
                      {trimmedLine.replace(/\*\*/g, '')}
                    </h4>
                  </div>
                );
              }

              // Check if it's a numbered step
              const numberedMatch = trimmedLine.match(/^(\d+)\.\s*(.+)$/);
              if (numberedMatch) {
                return (
                  <div key={index} className="flex items-start">
                    <div className="mr-4 mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-teal-100">
                      <span className="text-sm font-semibold text-teal-700">
                        {numberedMatch[1]}
                      </span>
                    </div>
                    <p className="pt-1 leading-relaxed text-gray-700">
                      {numberedMatch[2]}
                    </p>
                  </div>
                );
              }

              // Regular paragraph
              return (
                <p key={index} className="ml-12 leading-relaxed text-gray-700">
                  {trimmedLine}
                </p>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      {recipe.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recipe.notes.split('\n').map((line, index) => {
                const trimmedLine = line.trim();

                if (!trimmedLine) return null;

                // Check if it's a section header (starts with **)
                if (
                  trimmedLine.startsWith('**') &&
                  trimmedLine.endsWith('**')
                ) {
                  return (
                    <div key={index} className="mt-6 first:mt-0">
                      <h4 className="mb-2 text-lg font-semibold text-gray-800">
                        {trimmedLine.replace(/\*\*/g, '')}
                      </h4>
                    </div>
                  );
                }

                // Check if it's a bullet point
                if (
                  trimmedLine.startsWith('•') ||
                  trimmedLine.startsWith('-')
                ) {
                  return (
                    <div key={index} className="flex items-start">
                      <div className="mr-3 mt-2.5 h-2 w-2 flex-shrink-0 rounded-full bg-gray-400"></div>
                      <p className="leading-relaxed text-gray-700">
                        {trimmedLine.replace(/^[•-]\s*/, '')}
                      </p>
                    </div>
                  );
                }

                // Regular paragraph
                return (
                  <p key={index} className="leading-relaxed text-gray-700">
                    {trimmedLine}
                  </p>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
