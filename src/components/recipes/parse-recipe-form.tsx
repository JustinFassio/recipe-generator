import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Wand2 } from 'lucide-react';
import { parseRecipeSchema, type ParseRecipeFormData, type RecipeFormData } from '@/lib/schemas';
import { useParseRecipe } from '@/hooks/use-recipes';

interface ParseRecipeFormProps {
  onParsed: (data: RecipeFormData) => void;
}

export function ParseRecipeForm({ onParsed }: ParseRecipeFormProps) {
  const [showExample, setShowExample] = useState(false);
  const parseRecipe = useParseRecipe();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<ParseRecipeFormData>({
    resolver: zodResolver(parseRecipeSchema),
  });

  const onSubmit = async (data: ParseRecipeFormData) => {
    try {
      const parsed = await parseRecipe.mutateAsync(data.recipeText);
      onParsed(parsed);
    } catch (error) {
      console.error('Parse error:', error);
    }
  };

  const loadExample = () => {
    const example = `# Chocolate Chip Cookies

## Ingredients
- 2 1/4 cups all-purpose flour
- 1 teaspoon baking soda
- 1 teaspoon salt
- 1 cup butter, softened
- 3/4 cup granulated sugar
- 3/4 cup brown sugar, packed
- 2 large eggs
- 2 teaspoons vanilla extract
- 2 cups chocolate chips

## Instructions
1. Preheat oven to 375°F (190°C).
2. Mix flour, baking soda, and salt in a bowl.
3. Cream butter and sugars until light and fluffy.
4. Beat in eggs and vanilla.
5. Gradually blend in flour mixture.
6. Stir in chocolate chips.
7. Drop rounded tablespoons onto ungreased cookie sheets.
8. Bake 9-11 minutes or until golden brown.

## Notes
Makes about 48 cookies. Store in airtight container.`;

    setValue('recipeText', example);
    setShowExample(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Wand2 className="h-5 w-5 text-orange-500" />
          <span>Parse Recipe</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="recipeText">Recipe Content *</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowExample(!showExample)}
              >
                {showExample ? 'Hide' : 'Show'} Example
              </Button>
            </div>
            
            {showExample && (
              <Alert className="mb-4">
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-medium">Supported formats:</p>
                    <ul className="text-sm space-y-1 ml-4">
                      <li>• Markdown with headings (# Title, ## Ingredients, ## Instructions)</li>
                      <li>• Lists with - or * or numbered items</li>
                      <li>• JSON with title, ingredients[], instructions, notes fields</li>
                    </ul>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={loadExample}
                      className="mt-2 border-green-600 text-green-600 hover:bg-green-50"
                    >
                      Load Example
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <Textarea
              id="recipeText"
              {...register('recipeText')}
              placeholder="Paste your recipe here (Markdown, JSON, or plain text)..."
              rows={8}
              className="resize-none font-mono text-sm"
            />
            {errors.recipeText && (
              <p className="text-sm text-red-500 mt-1">{errors.recipeText.message}</p>
            )}
          </div>

          <Button
            type="submit"
            disabled={parseRecipe.isPending}
            className="w-full"
          >
            {parseRecipe.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Parsing Recipe...
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4 mr-2" />
                Parse Recipe
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}