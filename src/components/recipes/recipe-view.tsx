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
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        {onBack && (
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Recipes
          </Button>
        )}
        {onEdit && (
          <Button onClick={onEdit}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Recipe
          </Button>
        )}
      </div>

      {/* Recipe Header */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col lg:flex-row lg:items-start gap-6">
            {recipe.image_url && (
              <div className="lg:w-1/3">
                <img
                  src={recipe.image_url}
                  alt={recipe.title}
                  className="w-full h-64 lg:h-48 object-cover rounded-lg"
                />
              </div>
            )}
            <div className="flex-1">
              <CardTitle className="text-2xl lg:text-3xl font-bold mb-4">
                {recipe.title}
              </CardTitle>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-1" />
                  <Badge variant="secondary">
                    {recipe.ingredients.length} ingredients
                  </Badge>
                </div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>Added {new Date(recipe.created_at).toLocaleDateString()}</span>
                </div>
                {recipe.updated_at !== recipe.created_at && (
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    <span>Updated {new Date(recipe.updated_at).toLocaleDateString()}</span>
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
                    <h4 className="font-semibold text-lg text-gray-800 mb-2">
                      {ingredient.replace(/^---\s*/, '').replace(/\s*---$/, '')}
                    </h4>
                  </div>
                ) : (
                  // Regular ingredient
                  <>
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center mt-0.5 mr-3">
                      <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                    </div>
                    <p className="text-gray-700 leading-relaxed">{ingredient}</p>
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
                    <h4 className="font-semibold text-lg text-gray-800">
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
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center mr-4 mt-0.5">
                      <span className="text-sm font-semibold text-teal-700">
                        {numberedMatch[1]}
                      </span>
                    </div>
                    <p className="text-gray-700 leading-relaxed pt-1">
                      {numberedMatch[2]}
                    </p>
                  </div>
                );
              }
              
              // Regular paragraph
              return (
                <p key={index} className="text-gray-700 leading-relaxed ml-12">
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
                if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**')) {
                  return (
                    <div key={index} className="mt-6 first:mt-0">
                      <h4 className="font-semibold text-lg text-gray-800 mb-2">
                        {trimmedLine.replace(/\*\*/g, '')}
                      </h4>
                    </div>
                  );
                }
                
                // Check if it's a bullet point
                if (trimmedLine.startsWith('•') || trimmedLine.startsWith('-')) {
                  return (
                    <div key={index} className="flex items-start">
                      <div className="flex-shrink-0 w-2 h-2 rounded-full bg-gray-400 mt-2.5 mr-3"></div>
                      <p className="text-gray-700 leading-relaxed">
                        {trimmedLine.replace(/^[•-]\s*/, '')}
                      </p>
                    </div>
                  );
                }
                
                // Regular paragraph
                return (
                  <p key={index} className="text-gray-700 leading-relaxed">
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