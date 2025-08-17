# Phase 5: Integration Points

**Component assembly and feature integration across the application**

---

## 🎯 **Phase Objectives**

Integrate category components into the existing recipe system, ensuring seamless user experience across recipe creation, editing, viewing, and discovery workflows.

## 📋 **Deliverables**

- [x] Recipe view integration
- [x] Recipe form integration
- [x] Recipe card updates
- [x] Search and filtering integration
- [x] API integration updates
- [x] State management updates

## 🔗 **Integration Architecture**

### **1. Recipe View Integration**

**File**: `src/components/recipes/recipe-view.tsx` (updates to existing component)

```typescript
import { CategoryDisplay } from './category-display';
// ... existing imports

export function RecipeView({ recipe, onEdit, onBack }: RecipeViewProps) {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header - existing code */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
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

      {/* Recipe Header with Categories */}
      <div className={createDaisyUICardClasses('bordered')}>
        <div className="card-body pb-4">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
            {recipe.image_url && (
              <div className="lg:w-1/3">
                <img
                  src={recipe.image_url}
                  alt={recipe.title}
                  className="h-48 w-full rounded-lg object-cover sm:h-64 lg:h-48"
                />
              </div>
            )}
            <div className="flex-1">
              <h3 className={`${createDaisyUICardTitleClasses()} mb-4 text-xl font-bold sm:text-2xl lg:text-3xl`}>
                {recipe.title}
              </h3>

              {/* NEW: Category Display */}
              <CategoryDisplay
                categories={recipe.categories || []}
                className="mb-4"
                maxVisible={6}
                onCategoryClick={(category) => {
                  // Optional: Navigate to filtered recipe list
                  console.log('Filter by category:', category);
                }}
              />

              <div className="flex flex-col gap-2 text-sm text-gray-600 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
                <div className="flex items-center">
                  <Users className="mr-1 h-4 w-4" />
                  <span className={createDaisyUIBadgeClasses('secondary')}>
                    {recipe.ingredients.length} ingredients
                  </span>
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
        </div>
      </div>

      {/* Existing ingredients, instructions, and notes sections remain unchanged */}
      {/* ... rest of existing component */}
    </div>
  );
}
```

### **2. Recipe Form Integration**

**File**: `src/components/recipes/recipe-form.tsx` (updates to existing component)

```typescript
import { CategoryInput } from '@/components/ui/category-input';
import { getCategorySuggestions } from '@/lib/category-suggestions';
// ... existing imports

export function RecipeForm({
  initialData,
  onSuccess,
  onCancel
}: RecipeFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [showImageUpload, setShowImageUpload] = useState(false);

  const form = useForm<RecipeFormData>({
    resolver: zodResolver(recipeSchema),
    defaultValues: {
      title: initialData?.title || '',
      ingredients: initialData?.ingredients || [''],
      instructions: initialData?.instructions || '',
      notes: initialData?.notes || '',
      image_url: initialData?.image_url || '',
      categories: initialData?.categories || [] // NEW FIELD
    }
  });

  const { fields: ingredientFields, append: appendIngredient, remove: removeIngredient } = useFieldArray({
    control: form.control,
    name: 'ingredients'
  });

  // NEW: Watch form values for category suggestions
  const watchedTitle = form.watch('title');
  const watchedIngredients = form.watch('ingredients');
  const watchedInstructions = form.watch('instructions');
  const watchedCategories = form.watch('categories');

  // NEW: Generate category suggestions based on recipe content
  const categorySuggestions = useMemo(() => {
    if (!watchedTitle && (!watchedIngredients || watchedIngredients.every(i => !i.trim()))) {
      return [];
    }

    return getCategorySuggestions(
      watchedCategories,
      {
        title: watchedTitle,
        ingredients: watchedIngredients.filter(Boolean),
        instructions: watchedInstructions
      }
    );
  }, [watchedTitle, watchedIngredients, watchedInstructions, watchedCategories]);

  // ... existing form submission logic

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <h1 className="text-3xl font-bold text-gray-900">
          {initialData ? 'Edit Recipe' : 'Add New Recipe'}
        </h1>
        {onCancel && (
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Recipe Details Card */}
          <div className={createDaisyUICardClasses('bordered')}>
            <div className="card-body">
              <h3 className={`${createDaisyUICardTitleClasses()} text-xl font-semibold`}>
                Recipe Details
              </h3>

              <div className="grid gap-6 md:grid-cols-2">
                {/* Title Field */}
                <div className="md:col-span-2">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Recipe Title</FormLabel>
                        <FormControl>
                          <input
                            type="text"
                            placeholder="Enter recipe title..."
                            className={createDaisyUIInputClasses('bordered')}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* NEW: Categories Field */}
                <div className="md:col-span-2">
                  <FormField
                    control={form.control}
                    name="categories"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Categories</FormLabel>
                        <FormControl>
                          <CategoryInput
                            value={field.value}
                            onChange={field.onChange}
                            suggestions={categorySuggestions}
                            placeholder="Add categories to help organize your recipe..."
                            maxCategories={6}
                            error={form.formState.errors.categories?.message}
                          />
                        </FormControl>
                        <FormDescription>
                          Categories help organize and discover your recipes.
                          Start typing or choose from suggestions.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Image Upload Section - existing code */}
                {/* ... */}
              </div>
            </div>
          </div>

          {/* Existing ingredients, instructions, and notes sections remain unchanged */}
          {/* ... rest of existing form */}
        </form>
      </Form>
    </div>
  );
}
```

### **3. Recipe Card Updates**

**File**: `src/components/recipes/recipe-card.tsx` (updates to existing component)

```typescript
import { CategoryDisplayCompact } from './category-display';
// ... existing imports

export function RecipeCard({ recipe, onView, onEdit, onDelete }: RecipeCardProps) {
  return (
    <div className="card card-bordered group overflow-hidden transition-all duration-200 hover:shadow-lg">
      {recipe.image_url && (
        <div className="aspect-video overflow-hidden">
          <img
            src={recipe.image_url}
            alt={recipe.title}
            className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
          />
        </div>
      )}

      <div className="card-body">
        <h3 className="card-title line-clamp-2 text-lg font-semibold">
          {recipe.title}
        </h3>

        {/* NEW: Compact Category Display */}
        <CategoryDisplayCompact
          categories={recipe.categories || []}
          maxVisible={3}
          className="mb-2"
          onCategoryClick={(category) => {
            // Optional: Filter recipes by category
            console.log('Filter by category:', category);
          }}
        />

        <div className="flex items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center">
            <Users className="mr-1 h-4 w-4" />
            <span>{recipe.ingredients.length} ingredients</span>
          </div>
          <div className="flex items-center">
            <Calendar className="mr-1 h-4 w-4" />
            <span>{new Date(recipe.created_at).toLocaleDateString()}</span>
          </div>
        </div>

        <div className="card-actions justify-end mt-4">
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => onView(recipe.id)}
            aria-label={`View ${recipe.title}`}
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => onEdit(recipe.id)}
            aria-label={`Edit ${recipe.title}`}
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            className="btn btn-ghost btn-sm text-error hover:bg-error hover:text-error-content"
            onClick={() => onDelete(recipe.id)}
            aria-label={`Delete ${recipe.title}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
```

### **4. Recipes Page Integration**

**File**: `src/pages/recipes-page.tsx` (updates to existing component)

```typescript
import { CategoryFilter } from '@/components/ui/category-filter';
import { CategoryStatsDisplay } from '@/components/ui/category-stats';
// ... existing imports

export function RecipesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]); // NEW STATE
  const [showStats, setShowStats] = useState(false); // NEW STATE

  const {
    data: recipes,
    isLoading,
    error,
    refetch
  } = useRecipes();

  // NEW: Filter recipes by categories and search term
  const filteredRecipes = useMemo(() => {
    if (!recipes) return [];

    return recipes.filter(recipe => {
      // Search term filter
      const matchesSearch = !searchTerm ||
        recipe.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        recipe.ingredients.some(ingredient =>
          ingredient.toLowerCase().includes(searchTerm.toLowerCase())
        ) ||
        recipe.instructions.toLowerCase().includes(searchTerm.toLowerCase());

      // Category filter
      const matchesCategories = selectedCategories.length === 0 ||
        selectedCategories.every(category =>
          recipe.categories?.includes(category)
        );

      return matchesSearch && matchesCategories;
    });
  }, [recipes, searchTerm, selectedCategories]);

  // NEW: Calculate category statistics
  const categoryStats = useMemo(() => {
    if (!recipes) return [];

    const categoryCount = new Map<string, number>();
    const totalRecipes = recipes.length;

    recipes.forEach(recipe => {
      recipe.categories?.forEach(category => {
        categoryCount.set(category, (categoryCount.get(category) || 0) + 1);
      });
    });

    return Array.from(categoryCount.entries())
      .map(([category, count]) => ({
        category,
        count,
        percentage: (count / totalRecipes) * 100
      }))
      .sort((a, b) => b.count - a.count);
  }, [recipes]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-teal-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Recipes</h1>
            <p className="mt-1 text-gray-600">
              {filteredRecipes.length} of {recipes?.length || 0} recipes
              {selectedCategories.length > 0 && (
                <span className="ml-2">
                  (filtered by {selectedCategories.length} categories)
                </span>
              )}
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowStats(!showStats)}
              className="gap-2"
            >
              <BarChart3 className="h-4 w-4" />
              {showStats ? 'Hide' : 'Show'} Stats
            </Button>

            <Button onClick={() => window.location.reload()} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>

            <Link to="/add-recipe">
              <Button variant="default" className="gap-2">
                <Plus className="h-4 w-4" />
                Add Recipe
              </Button>
            </Link>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search recipes, ingredients, or instructions..."
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              className={`${createDaisyUIInputClasses('bordered')} pl-10`}
            />
          </div>

          {/* NEW: Category Filter */}
          <CategoryFilter
            selectedCategories={selectedCategories}
            onCategoriesChange={setSelectedCategories}
            availableCategories={categoryStats.map(stat => stat.category)}
          />

          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchTerm('')}
              className="gap-2"
            >
              <X className="h-4 w-4" />
              Clear Search
            </Button>
          )}
        </div>

        {/* Active Filters Display */}
        {selectedCategories.length > 0 && (
          <div className="mb-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Active filters:</span>
              {selectedCategories.map((category, index) => (
                <CategoryChipRemovable
                  key={`filter-${category}-${index}`}
                  category={category}
                  size="sm"
                  onRemove={(cat) => {
                    setSelectedCategories(prev => prev.filter(c => c !== cat));
                  }}
                />
              ))}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedCategories([])}
                className="gap-1"
              >
                <X className="h-3 w-3" />
                Clear all
              </Button>
            </div>
          </div>
        )}

        {/* Content Grid */}
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Main Content */}
          <div className={showStats ? 'lg:col-span-8' : 'lg:col-span-12'}>
            {/* Loading State */}
            {isLoading && (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="card card-bordered">
                    <div className="card-body">
                      <div className="skeleton h-6 w-3/4 mb-4"></div>
                      <div className="skeleton h-4 w-full mb-2"></div>
                      <div className="skeleton h-4 w-2/3 mb-4"></div>
                      <div className="flex gap-2">
                        <div className="skeleton h-6 w-16"></div>
                        <div className="skeleton h-6 w-20"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="card card-bordered">
                <div className="card-body text-center">
                  <p className="text-error">Failed to load recipes. Please try again.</p>
                  <Button onClick={() => refetch()} className="mt-4">
                    Retry
                  </Button>
                </div>
              </div>
            )}

            {/* Empty State */}
            {!isLoading && !error && filteredRecipes.length === 0 && recipes && recipes.length > 0 && (
              <div className="card card-bordered">
                <div className="card-body text-center">
                  <p className="text-gray-500 mb-4">
                    No recipes found matching your filters.
                  </p>
                  <div className="flex justify-center gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSearchTerm('');
                        setSelectedCategories([]);
                      }}
                    >
                      Clear Filters
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Recipe Grid */}
            {!isLoading && !error && filteredRecipes.length > 0 && (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredRecipes.map((recipe) => (
                  <RecipeCard
                    key={recipe.id}
                    recipe={recipe}
                    onView={(id) => navigate(`/recipe/${id}`)}
                    onEdit={(id) => navigate(`/recipe/${id}/edit`)}
                    onDelete={handleDeleteRecipe}
                  />
                ))}
              </div>
            )}
          </div>

          {/* NEW: Category Statistics Sidebar */}
          {showStats && (
            <div className="lg:col-span-4">
              <div className="sticky top-8">
                <CategoryStatsDisplay
                  stats={categoryStats}
                  title="Category Usage"
                  maxVisible={15}
                  onCategoryClick={(category) => {
                    if (!selectedCategories.includes(category)) {
                      setSelectedCategories(prev => [...prev, category]);
                    }
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

### **5. API Integration Updates**

**File**: `src/hooks/use-recipes.ts` (updates to existing hook)

```typescript
// ... existing imports
import { CategoryFilter } from '@/lib/category-types';

// NEW: Extended query options
interface RecipeQueryOptions {
  searchTerm?: string;
  categories?: string[];
  limit?: number;
  offset?: number;
}

// NEW: Recipe statistics interface
interface RecipeStatistics {
  totalRecipes: number;
  categoryCounts: Record<string, number>;
  topCategories: Array<{ category: string; count: number; percentage: number }>;
}

export function useRecipes(options?: RecipeQueryOptions) {
  return useQuery({
    queryKey: ['recipes', options],
    queryFn: async () => {
      let query = supabase
        .from('recipes')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      // Apply category filter
      if (options?.categories && options.categories.length > 0) {
        query = query.contains('categories', options.categories);
      }

      // Apply search filter
      if (options?.searchTerm) {
        query = query.or(
          `title.ilike.%${options.searchTerm}%,` +
            `instructions.ilike.%${options.searchTerm}%,` +
            `notes.ilike.%${options.searchTerm}%`
        );
      }

      // Apply pagination
      if (options?.limit) {
        query = query.limit(options.limit);
      }
      if (options?.offset) {
        query = query.range(
          options.offset,
          options.offset + (options.limit || 10) - 1
        );
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Recipe[];
    },
    enabled: !!user,
  });
}

// NEW: Recipe statistics hook
export function useRecipeStatistics() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['recipe-statistics', user?.id],
    queryFn: async (): Promise<RecipeStatistics> => {
      const { data: recipes, error } = await supabase
        .from('recipes')
        .select('categories')
        .eq('user_id', user?.id);

      if (error) throw error;

      const totalRecipes = recipes.length;
      const categoryCounts: Record<string, number> = {};

      // Count category occurrences
      recipes.forEach((recipe) => {
        recipe.categories?.forEach((category: string) => {
          categoryCounts[category] = (categoryCounts[category] || 0) + 1;
        });
      });

      // Calculate top categories with percentages
      const topCategories = Object.entries(categoryCounts)
        .map(([category, count]) => ({
          category,
          count,
          percentage: (count / totalRecipes) * 100,
        }))
        .sort((a, b) => b.count - a.count);

      return {
        totalRecipes,
        categoryCounts,
        topCategories,
      };
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// NEW: Category-based recipe recommendations
export function useRecipeRecommendations(currentRecipeId?: string, limit = 6) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['recipe-recommendations', currentRecipeId, limit],
    queryFn: async () => {
      if (!currentRecipeId) return [];

      // Get current recipe categories
      const { data: currentRecipe, error: currentError } = await supabase
        .from('recipes')
        .select('categories')
        .eq('id', currentRecipeId)
        .eq('user_id', user?.id)
        .single();

      if (currentError || !currentRecipe.categories?.length) return [];

      // Find recipes with similar categories
      const { data: recommendations, error } = await supabase
        .from('recipes')
        .select('*')
        .eq('user_id', user?.id)
        .neq('id', currentRecipeId)
        .overlaps('categories', currentRecipe.categories)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return recommendations as Recipe[];
    },
    enabled: !!user && !!currentRecipeId,
  });
}

// ... existing hooks remain unchanged
```

### **6. State Management Updates**

**File**: `src/hooks/useConversation.ts` (updates for category handling)

```typescript
// ... existing imports and interfaces

// Update the recipe generation to include categories
const convertToRecipe = useCallback(async () => {
  try {
    setIsLoading(true);

    // Extract the last few assistant messages to get complete recipe content
    const assistantMessages = messages
      .filter((msg) => msg.role === 'assistant')
      .slice(-3);

    if (assistantMessages.length === 0) {
      throw new Error('No recipe content found in conversation');
    }

    // Combine the assistant messages to get the full recipe text
    const recipeText = assistantMessages.map((msg) => msg.content).join('\n\n');

    // Use the existing parsing infrastructure (now includes categories)
    const recipe = await parseRecipeFromText(recipeText);

    // NEW: Enhance categories with AI suggestions if needed
    if (persona) {
      const { validateAndEnhanceCategories } = await import(
        '@/lib/category-suggestions'
      );
      const enhancedCategories = validateAndEnhanceCategories(
        recipe.categories || [],
        {
          title: recipe.title,
          ingredients: recipe.ingredients,
          instructions: recipe.instructions,
          notes: recipe.notes,
        },
        persona
      );

      recipe.categories = enhancedCategories;
    }

    setGeneratedRecipe(recipe);

    toast({
      title: 'Recipe Parsed!',
      description: `Your recipe has been parsed with ${recipe.categories?.length || 0} categories and is ready to review and save.`,
    });
  } catch (error) {
    console.error('Recipe parsing error:', error);

    let errorDescription =
      'Failed to parse recipe from conversation. Please try again.';
    if (error instanceof Error) {
      errorDescription = `Parsing failed: ${error.message}`;
    }

    toast({
      title: 'Recipe Parsing Failed',
      description: errorDescription,
      variant: 'destructive',
    });
  } finally {
    setIsLoading(false);
  }
}, [messages, parseRecipeFromText, toast, persona]);

// ... rest of existing hook remains unchanged
```

## 🧪 **Integration Testing**

### **1. Recipe View Integration Tests**

**File**: `src/__tests__/integration/recipe-view-categories.test.tsx`

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RecipeView } from '@/components/recipes/recipe-view';
import { Recipe } from '@/lib/supabase';

const mockRecipeWithCategories: Recipe = {
  id: '1',
  title: 'Pasta Carbonara',
  ingredients: ['400g spaghetti', '200g pancetta'],
  instructions: 'Cook pasta and mix with pancetta',
  notes: 'Traditional Roman dish',
  categories: ['Course: Main', 'Cuisine: Italian', 'Technique: Sauté'],
  image_url: null,
  user_id: 'user-1',
  created_at: '2025-01-01',
  updated_at: '2025-01-01'
};

describe('Recipe View Categories Integration', () => {
  it('should display recipe categories', () => {
    render(<RecipeView recipe={mockRecipeWithCategories} />);

    expect(screen.getByText('Categories')).toBeInTheDocument();
    expect(screen.getByText('Main')).toBeInTheDocument();
    expect(screen.getByText('Italian')).toBeInTheDocument();
    expect(screen.getByText('Sauté')).toBeInTheDocument();
  });

  it('should handle recipes without categories', () => {
    const recipeWithoutCategories = { ...mockRecipeWithCategories, categories: [] };
    render(<RecipeView recipe={recipeWithoutCategories} />);

    // Categories section should not be rendered
    expect(screen.queryByText('Categories')).not.toBeInTheDocument();
  });

  it('should limit visible categories when there are many', () => {
    const recipeWithManyCategories = {
      ...mockRecipeWithCategories,
      categories: Array.from({ length: 10 }, (_, i) => `Category ${i + 1}`)
    };

    render(<RecipeView recipe={recipeWithManyCategories} />);

    // Should show "+X more" indicator
    expect(screen.getByText(/\+\d+ more/)).toBeInTheDocument();
  });
});
```

### **2. Recipe Form Integration Tests**

**File**: `src/__tests__/integration/recipe-form-categories.test.tsx`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RecipeForm } from '@/components/recipes/recipe-form';
import { RecipeFormData } from '@/lib/schemas';

const mockInitialData: RecipeFormData = {
  title: 'Test Recipe',
  ingredients: ['ingredient 1'],
  instructions: 'Test instructions',
  notes: 'Test notes',
  categories: ['Course: Main']
};

describe('Recipe Form Categories Integration', () => {
  it('should display existing categories in form', () => {
    render(
      <RecipeForm
        initialData={mockInitialData}
        onSuccess={vi.fn()}
      />
    );

    expect(screen.getByText('Main')).toBeInTheDocument();
  });

  it('should allow adding new categories', async () => {
    const user = userEvent.setup();
    const mockOnSuccess = vi.fn();

    render(
      <RecipeForm
        initialData={mockInitialData}
        onSuccess={mockOnSuccess}
      />
    );

    const categoryInput = screen.getByPlaceholderText(/Add categories/);
    await user.type(categoryInput, 'Cuisine: Italian');
    await user.keyboard('{Enter}');

    expect(screen.getByText('Italian')).toBeInTheDocument();
  });

  it('should show category suggestions based on recipe content', async () => {
    const user = userEvent.setup();

    render(
      <RecipeForm
        initialData={{ ...mockInitialData, title: 'Italian Pasta' }}
        onSuccess={vi.fn()}
      />
    );

    const categoryInput = screen.getByPlaceholderText(/Add categories/);
    await user.click(categoryInput);

    // Should suggest Italian cuisine based on title
    await waitFor(() => {
      expect(screen.getByText('Cuisine: Italian')).toBeInTheDocument();
    });
  });

  it('should prevent adding duplicate categories', async () => {
    const user = userEvent.setup();

    render(
      <RecipeForm
        initialData={mockInitialData}
        onSuccess={vi.fn()}
      />
    );

    const categoryInput = screen.getByPlaceholderText(/Add categories/);
    await user.type(categoryInput, 'Course: Main');
    await user.keyboard('{Enter}');

    // Should still only have one "Main" category
    const mainCategories = screen.getAllByText('Main');
    expect(mainCategories).toHaveLength(1);
  });

  it('should respect maximum category limit', async () => {
    const user = userEvent.setup();
    const manyCategories = Array.from({ length: 6 }, (_, i) => `Category ${i + 1}`);

    render(
      <RecipeForm
        initialData={{ ...mockInitialData, categories: manyCategories }}
        onSuccess={vi.fn()}
      />
    );

    const categoryInput = screen.getByPlaceholderText(/Max 6 categories/);
    expect(categoryInput).toBeDisabled();
  });
});
```

### **3. Recipes Page Integration Tests**

**File**: `src/__tests__/integration/recipes-page-categories.test.tsx`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RecipesPage } from '@/pages/recipes-page';
import { useRecipes } from '@/hooks/use-recipes';

// Mock the useRecipes hook
vi.mock('@/hooks/use-recipes');

const mockRecipes = [
  {
    id: '1',
    title: 'Pasta Carbonara',
    categories: ['Course: Main', 'Cuisine: Italian'],
    ingredients: ['pasta', 'eggs'],
    instructions: 'Cook pasta',
    notes: '',
    created_at: '2025-01-01'
  },
  {
    id: '2',
    title: 'Caesar Salad',
    categories: ['Course: Appetizer', 'Cuisine: Roman'],
    ingredients: ['lettuce', 'croutons'],
    instructions: 'Mix ingredients',
    notes: '',
    created_at: '2025-01-02'
  }
];

describe('Recipes Page Categories Integration', () => {
  beforeEach(() => {
    vi.mocked(useRecipes).mockReturnValue({
      data: mockRecipes,
      isLoading: false,
      error: null,
      refetch: vi.fn()
    } as any);
  });

  it('should display category filter', () => {
    render(<RecipesPage />);

    expect(screen.getByText('Categories')).toBeInTheDocument();
  });

  it('should filter recipes by category', async () => {
    render(<RecipesPage />);

    // Open category filter
    fireEvent.click(screen.getByText('Categories'));

    // Select "Course: Main" filter
    await waitFor(() => {
      const mainFilter = screen.getByText('Main');
      fireEvent.click(mainFilter);
    });

    // Should show active filter
    expect(screen.getByText('Active filters:')).toBeInTheDocument();
  });

  it('should show category statistics when enabled', () => {
    render(<RecipesPage />);

    // Click show stats button
    fireEvent.click(screen.getByText('Show Stats'));

    expect(screen.getByText('Category Usage')).toBeInTheDocument();
  });

  it('should clear all filters when requested', async () => {
    render(<RecipesPage />);

    // Add some filters first
    fireEvent.click(screen.getByText('Categories'));
    await waitFor(() => {
      fireEvent.click(screen.getByText('Main'));
    });

    // Clear all filters
    fireEvent.click(screen.getByText('Clear all'));

    // Active filters should be gone
    expect(screen.queryByText('Active filters:')).not.toBeInTheDocument();
  });
});
```

## 📋 **Implementation Checklist**

### **Component Integration**

- [ ] Update `RecipeView` component with category display
- [ ] Update `RecipeForm` component with category input
- [ ] Update `RecipeCard` component with compact category display
- [ ] Update `RecipesPage` with filtering and statistics
- [ ] Test all component integrations

### **API Integration**

- [ ] Update `useRecipes` hook with category filtering
- [ ] Create `useRecipeStatistics` hook
- [ ] Create `useRecipeRecommendations` hook
- [ ] Update database queries for category support
- [ ] Test API integrations

### **State Management**

- [ ] Update conversation hook for category enhancement
- [ ] Update form state management
- [ ] Update filter state management
- [ ] Test state management flows

### **User Experience**

- [ ] Implement category-based filtering
- [ ] Add category statistics display
- [ ] Create category-based recommendations
- [ ] Add category search functionality
- [ ] Test complete user workflows

### **Performance**

- [ ] Optimize category filtering queries
- [ ] Implement category data caching
- [ ] Add pagination for large category lists
- [ ] Monitor performance metrics

## ✅ **Success Criteria**

- [ ] Categories display correctly in all recipe views
- [ ] Category input works smoothly in recipe forms
- [ ] Category filtering works accurately on recipes page
- [ ] Category statistics provide useful insights
- [ ] Performance remains optimal with categories
- [ ] All integration tests pass
- [ ] User workflows are intuitive and efficient

## 🔗 **Next Phase**

Once Phase 5 is complete, proceed to [Phase 6: Canonical Categories](phase-6-canonical-categories.md) to establish the category taxonomy and configuration management.

---

**Phase Status**: 📋 Ready for Implementation  
**Estimated Time**: 3-4 days  
**Prerequisites**: Phase 4 complete  
**Next Phase**: [Phase 6 - Canonical Categories](phase-6-canonical-categories.md)
