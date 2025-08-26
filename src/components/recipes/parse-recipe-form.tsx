import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createDaisyUILabelClasses } from '@/lib/label-migration';
import {
  createDaisyUICardClasses,
  createDaisyUICardTitleClasses,
} from '@/lib/card-migration';
import {
  createDaisyUIAlertClasses,
  createDaisyUIAlertDescriptionClasses,
} from '@/lib/alert-migration';
import { Loader2, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  parseRecipeSchema,
  type ParseRecipeFormData,
  type RecipeFormData,
} from '@/lib/schemas';
import type { ParsedRecipe } from '@/lib/types';
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
      const parsed = (await parseRecipe.mutateAsync(
        data.recipeText
      )) as ParsedRecipe;
      // Convert ParsedRecipe to RecipeFormData
      const recipeFormData: RecipeFormData = {
        title: parsed.title,
        ingredients: parsed.ingredients,
        instructions: parsed.instructions,
        notes: parsed.notes || '',
        image_url: '',
        categories: parsed.categories || [],
      };
      onParsed(recipeFormData);
    } catch (error) {
      console.error('Parse error:', error);
    }
  };

  const loadExample = () => {
    const example = `🌼 Golden Summer Curry with Blistered Shishito Peppers

*(Vegan, summer-balanced, anti-inflammatory)*

---

### **Prep First (Mise en Place)**

* **Crookneck squash (2 small):** rinse, trim ends, chop into half-moons.
* **Cauliflower (1 cup florets):** cut into small bite-sized pieces.
* **Carrot (1 medium):** peel if desired, thinly slice into rounds or half-moons.
* **Onion (1 medium):** peel, slice thinly.
* **Garlic (3 cloves):** peel, mince.
* **Jalapeño (1 pepper):** slice lengthwise, remove seeds and white pith (unless you want extra heat), mince finely.
* **Shishito peppers (6–8 whole):** rinse and pat dry. Leave stems and seeds intact.
* Measure out **2 Tbsp curry powder, 1 tsp ground coriander, ½ tsp smoked paprika**.
* Have ready: **1 cup coconut milk**, **½ cup vegetable broth**.

---

### **Ingredients** (serves 2–3)

* Prepared vegetables and aromatics (above)
* 6–8 shishito peppers, whole (seeds in)
* 2 Tbsp curry powder (turmeric-forward if possible)
* 1 tsp ground coriander
* ½ tsp smoked paprika (optional)
* 1 cup coconut milk (or cashew cream/oat milk)
* ½ cup vegetable broth
* 1 Tbsp sesame oil (for curry base)
* 1–2 tsp sesame oil (for blistering shishitos)
* 1 Tbsp olive oil (to finish)
* Sea salt & black pepper, to taste
* Fresh cilantro or parsley, for garnish
* Lime or lemon wedge, for serving

---

### **Cooking Steps**

#### **Step 1: Blister the Shishitos**

1. Heat a cast iron or heavy skillet over **medium-high**.
2. Add **1–2 tsp sesame oil**, then whole **shishito peppers**.
3. Cook **2–3 minutes per side**, until blistered and charred in spots but still slightly firm.
4. Sprinkle lightly with sea salt; set aside.

---

#### **Step 2: Build the Curry Base**

1. In a wide pan, heat **1 Tbsp sesame oil**.
2. Add sliced onion, minced garlic, and minced jalapeño. Sauté 3–4 minutes until softened and fragrant.
3. Stir in curry powder, coriander, and paprika; toast gently for 1–2 minutes.

---

#### **Step 3: Cook the Vegetables**

1. Add chopped carrot, cauliflower, and crookneck squash. Stir to coat evenly in spices.
2. Season lightly with salt.

---

#### **Step 4: Simmer the Curry**

1. Pour in **coconut milk** and **vegetable broth**.
2. Simmer gently **8–10 minutes**, until vegetables are tender but squash still holds shape.

---

#### **Step 5: Finish and Serve**

1. Fold in blistered shishito peppers, warming through for 1 minute.
2. Drizzle with olive oil, add a squeeze of lime/lemon, and adjust seasoning.
3. Garnish with fresh cilantro or parsley.
4. Serve with jasmine rice, quinoa, or cauliflower rice.

---

✨ **Flow tip:** blister the shishitos first, then start the curry base in the same pan while they rest on a plate — you'll carry a little smoky flavor into the curry itself.`;

    setValue('recipeText', example);
    setShowExample(false);
  };

  return (
    <div className={createDaisyUICardClasses('bordered')}>
      <div className="card-body">
        <h3
          className={`${createDaisyUICardTitleClasses()} flex items-center space-x-2`}
        >
          <Wand2 className="h-5 w-5 text-orange-500" />
          <span>Parse Recipe</span>
        </h3>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label
                htmlFor="recipeText"
                className={createDaisyUILabelClasses()}
              >
                Recipe Content *
              </label>
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
              <div className={createDaisyUIAlertClasses('default', 'mb-4')}>
                <div className={createDaisyUIAlertDescriptionClasses()}>
                  <div className="space-y-2">
                    <p className="font-medium">Supported formats:</p>
                    <ul className="ml-4 space-y-1 text-sm">
                      <li>
                        • Any recipe text with Ingredients and Instructions
                        sections
                      </li>
                      <li>
                        • ChatGPT recipe outputs with emojis and formatting
                      </li>
                      <li>
                        • Markdown with headings (# Title, ## Ingredients, ##
                        Instructions)
                      </li>
                      <li>• Lists with - or * or numbered items</li>
                      <li>
                        • JSON with title, ingredients[], instructions, notes
                        fields
                      </li>
                    </ul>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-2 border-green-600 text-green-600 hover:bg-green-50"
                      onClick={loadExample}
                    >
                      Load Example
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <Textarea
              id="recipeText"
              {...register('recipeText')}
              placeholder="Paste your recipe here (any format from ChatGPT, websites, or your notes)..."
              rows={8}
              variant="default"
              size="md"
              className="w-full resize-none font-mono text-sm"
            />
            {errors.recipeText && (
              <p className="mt-1 text-sm text-red-500">
                {errors.recipeText.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={parseRecipe.isPending}
          >
            {parseRecipe.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Parsing Recipe...
              </>
            ) : (
              <>
                <Wand2 className="mr-2 h-4 w-4" />
                Parse Recipe
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
