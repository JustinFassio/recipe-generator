# Phase 0: Recipe Description Enhancement

**Add rich recipe descriptions to JSON structure for improved UX and AI image generation**

## 🎯 Objectives

- Add `description` field to recipe JSON schema
- Update AI persona prompts to generate rich descriptions
- Enhance recipe form to display and edit descriptions
- Update recipe view to prominently display descriptions
- Use descriptions as primary source for AI image generation prompts

## 📋 Deliverables

- [ ] Update recipe JSON schema to include description field
- [ ] Enhance AI persona prompts to generate descriptions
- [ ] Update recipe form UI to include description field
- [ ] Update recipe view to display descriptions prominently
- [ ] Update database schema to store descriptions
- [ ] Update image generation to use descriptions as prompts

## 🏗️ Implementation

### 1. Update Recipe Schema

**File**: `src/lib/schemas.ts`

```typescript
// Add description field to recipe schema
export const recipeFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional().default(''), // NEW FIELD
  ingredients: z.array(z.string().min(1)).min(1, 'At least one ingredient is required'),
  instructions: z.string().min(1, 'Instructions are required'),
  notes: z.string().optional().default(''),
  image_url: z.string().nullable().optional(),
  categories: z.array(z.string()).optional().default([]),
  setup: z.array(z.string()).optional().default([]),
  creator_rating: z.number().min(1).max(5).nullable().optional(),
});

// Update Recipe type
export interface RecipeFormData {
  title: string;
  description?: string; // NEW FIELD
  ingredients: string[];
  instructions: string;
  notes?: string;
  image_url?: string | null;
  categories?: string[];
  setup?: string[];
  creator_rating?: number | null;
}
```

### 2. Update AI Persona Prompts

**File**: `src/lib/openai.ts`

```typescript
// Update the JSON template in all personas
const ENHANCED_SAVE_RECIPE_PROMPT = `IMPORTANT: After providing a complete recipe or when the user seems satisfied with a recipe discussion, always ask: "Ready to Create and Save the Recipe?" This will allow the user to save the recipe to their collection.

CRITICAL: When providing a complete recipe, ALWAYS format it as structured JSON in a markdown code block for easy parsing:

\`\`\`json
{
  "title": "Recipe Name",
  "description": "A rich, appetizing description of the dish - describe the flavors, textures, visual appeal, and what makes it special. This should be 2-3 sentences that make someone want to cook and eat this dish.",
  "ingredients": [
    {
      "item": "ingredient name",
      "amount": "quantity needed",
      "prep": "preparation instructions"
    }
  ],
  "instructions": "Step-by-step cooking instructions",
  "setup": ["Prep time: X minutes", "Cook time: X minutes", "Equipment needed"],
  "categories": ["Course: Main", "Cuisine: Type", "Technique: Method"],
  "notes": "Tips, variations, and additional notes"
}
\`\`\`

The description field is crucial - it should be:
- Appetizing and descriptive (2-3 sentences)
- Focus on flavors, textures, and visual appeal
- Make someone want to cook and eat the dish
- Include what makes this recipe special or unique

This structured format ensures the recipe can be easily saved and will generate better images.`;

// Update all persona system prompts
export const RECIPE_BOT_PERSONAS: Record<string, PersonaConfig> = {
  chef: {
    name: 'Chef Marco',
    systemPrompt: `You are Chef Marco, an experienced Italian chef with 20+ years of culinary expertise. You specialize in Mediterranean cuisine and love teaching cooking techniques.

Your personality:
- Warm, enthusiastic, and encouraging
- Loves sharing cooking tips and techniques
- Emphasizes fresh ingredients and traditional methods
- Speaks with culinary authority but remains approachable
- Uses Italian cooking terms and explains them

Your role:
- Help users create delicious recipes step by step
- Ask thoughtful questions about preferences and skill level
- Provide cooking tips and technique explanations
- Suggest ingredient substitutions and variations
- Guide users through the entire recipe creation process

${CONTEXT_USAGE_DIRECTIVE}

When generating a complete recipe, structure it as a JSON object with:
{
  "title": "Recipe Name",
  "description": "A rich, appetizing description of the dish - describe the flavors, textures, visual appeal, and what makes it special. This should be 2-3 sentences that make someone want to cook and eat this dish.",
  "ingredients": [
    {
      "item": "ingredient name",
      "amount": "quantity needed",
      "prep": "preparation instructions"
    }
  ],
  "instructions": ["Step 1", "Step 2", "Step 3"],
  "setup": ["Prep time: X minutes", "Cook time: X minutes", "Equipment needed"],
  "categories": ["Course: Main", "Cuisine: Type", "Technique: Method"],
  "notes": "Tips, variations, and additional notes"
}

${ENHANCED_SAVE_RECIPE_PROMPT}`,
    // ... rest of persona config
  },
  // Update all other personas with the same structure
};
```

### 3. Update Recipe Form UI

**File**: `src/components/recipes/recipe-form.tsx`

```typescript
// Add description field after title
<div className={createDaisyUICardClasses('bordered')}>
  <div className="card-body">
    <h3 className={createDaisyUICardTitleClasses()}>Recipe Details</h3>
    <div className="space-y-4">
      <div>
        <label htmlFor="title" className={createDaisyUILabelClasses()}>
          Recipe Title *
        </label>
        <input
          id="title"
          type="text"
          {...register('title')}
          placeholder="Enter recipe title"
          className={`${createDaisyUIInputClasses('bordered')} mt-1`}
        />
        {errors.title && (
          <p className="mt-1 text-sm text-red-500">
            {errors.title.message}
          </p>
        )}
      </div>

      {/* NEW: Description Field */}
      <div>
        <label htmlFor="description" className={createDaisyUILabelClasses()}>
          Recipe Description
        </label>
        <Textarea
          id="description"
          {...register('description')}
          placeholder="Describe your dish - flavors, textures, visual appeal, what makes it special..."
          rows={3}
          variant="default"
          size="md"
          className="w-full resize-none mt-1"
        />
        <p className="mt-1 text-sm text-gray-500">
          A rich description helps others discover your recipe and improves AI image generation.
        </p>
        {errors.description && (
          <p className="mt-1 text-sm text-red-500">
            {errors.description.message}
          </p>
        )}
      </div>

      <div>
        <label className={createDaisyUILabelClasses()}>
          Recipe Image
        </label>
        <div className="mt-2 space-y-4">
          {imagePreview && (
            <div className="relative h-48 w-full overflow-hidden rounded-lg bg-gray-100">
              <img
                src={imagePreview}
                alt="Recipe preview"
                className="h-full w-full object-cover"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2 bg-white/80 hover:bg-white"
                onClick={() => {
                  setImagePreview('');
                  setImageFile(null);
                  setValue('image_url', null);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              className="border-green-600 text-green-600 hover:bg-green-50"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload Image
            </Button>
            
            {/* NEW: Generate with AI button */}
            <Button
              type="button"
              variant="outline"
              className="border-purple-600 text-purple-600 hover:bg-purple-50"
              onClick={() => setShowImageGeneration(true)}
              disabled={!watch('description') && !watch('title')}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Generate with AI
            </Button>
          </div>
          
          <p className="text-sm text-gray-500">
            Upload a photo or generate one with AI. A good recipe description improves AI image quality.
          </p>
        </div>
      </div>
    </div>
  </div>
</div>
```

### 4. Update Recipe View Display

**File**: `src/components/recipes/recipe-view.tsx`

```typescript
// Add description display after title
<div className={createDaisyUICardClasses('bordered')}>
  <div className="card-body">
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {recipe.title}
        </h1>
        
        {/* NEW: Description Display */}
        {recipe.description && (
          <div className="mb-4">
            <p className="text-lg text-gray-700 leading-relaxed">
              {recipe.description}
            </p>
          </div>
        )}
        
        {/* Rest of existing content */}
        <div className="flex flex-wrap gap-2 mb-4">
          {recipe.categories?.map((category, index) => (
            <Badge key={index} variant="secondary">
              {category}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  </div>
</div>
```

### 5. Update Database Schema

**File**: `supabase/migrations/add_description_to_recipes.sql`

```sql
-- Add description column to recipes table
ALTER TABLE recipes 
ADD COLUMN IF NOT EXISTS description TEXT;

-- Add description to recipe_content_versions table
ALTER TABLE recipe_content_versions 
ADD COLUMN IF NOT EXISTS description TEXT;

-- Add index for description search
CREATE INDEX IF NOT EXISTS idx_recipes_description 
ON recipes USING GIN (to_tsvector('english', description));

-- Update RLS policies if needed
-- (existing policies should automatically include the new column)
```

### 6. Enhanced AI Image Generation with Description

**File**: `src/lib/ai-image-generation/recipe-context-analyzer.ts`

```typescript
/**
 * Generate intelligent image prompt from recipe context
 * NOW PRIORITIZES DESCRIPTION FIELD
 */
export function generateIntelligentPrompt(
  recipe: RecipeFormData,
  userPrompt?: string
): ImagePromptContext {
  const context = analyzeRecipeContext(recipe);
  
  // PRIORITY: Use description if available, fallback to title + context
  let basePrompt = '';
  
  if (recipe.description && recipe.description.trim()) {
    // Use the rich description as the primary prompt
    basePrompt = recipe.description;
  } else {
    // Fallback to title + context analysis
    basePrompt = userPrompt || generateBasePromptFromTitle(recipe.title);
  }
  
  // Enhance with context (cuisine, ingredients, etc.)
  const styleModifiers = buildStyleModifiers(context);
  const qualityEnhancers = buildQualityEnhancers(context);
  const contextTags = buildContextTags(context);
  const negativePrompts = buildNegativePrompts(context);

  // Combine into final prompt
  const enhancedPrompt = combinePromptElements(
    basePrompt,
    styleModifiers,
    qualityEnhancers,
    contextTags
  );

  return {
    basePrompt: enhancedPrompt,
    styleModifiers,
    qualityEnhancers,
    contextTags,
    negativePrompts
  };
}

/**
 * Enhanced prompt combination that preserves description quality
 */
function combinePromptElements(
  basePrompt: string,
  styleModifiers: string[],
  qualityEnhancers: string[],
  contextTags: string[]
): string {
  // If basePrompt is a rich description, preserve its quality
  if (basePrompt.length > 100 && basePrompt.includes(',')) {
    // Rich description - append modifiers more carefully
    const elements = [
      basePrompt,
      ...styleModifiers.slice(0, 2), // Limit modifiers for rich descriptions
      ...qualityEnhancers.slice(0, 2) // Limit enhancers
    ];
    return elements.join(', ');
  } else {
    // Simple title/prompt - use full enhancement
    const elements = [
      basePrompt,
      ...styleModifiers,
      ...qualityEnhancers,
      ...contextTags
    ];
    return elements.join(', ');
  }
}
```

## 🎯 Benefits of This Enhancement

### 1. **Improved User Experience**
- Rich descriptions help users understand what they're cooking
- Better recipe discovery through descriptive content
- More engaging recipe browsing experience

### 2. **Enhanced AI Image Generation**
- Descriptions provide rich context for image generation
- Better visual prompts lead to more accurate images
- Reduces need for manual prompt editing

### 3. **SEO and Discoverability**
- Rich descriptions improve search engine optimization
- Better social media sharing with descriptive content
- Enhanced recipe metadata

### 4. **Future-Proofing**
- Foundation for advanced features like recipe recommendations
- Better integration with external recipe platforms
- Enhanced analytics and user engagement tracking

## 🧪 Testing Strategy

### 1. Schema Validation Tests
```typescript
// Test that description field is optional and handled correctly
describe('Recipe Schema with Description', () => {
  it('should accept recipes with description', () => {
    const recipe = {
      title: 'Test Recipe',
      description: 'A delicious test recipe with rich flavors',
      ingredients: ['test ingredient'],
      instructions: 'Test instructions'
    };
    
    const result = recipeFormSchema.parse(recipe);
    expect(result.description).toBe('A delicious test recipe with rich flavors');
  });
  
  it('should handle recipes without description', () => {
    const recipe = {
      title: 'Test Recipe',
      ingredients: ['test ingredient'],
      instructions: 'Test instructions'
    };
    
    const result = recipeFormSchema.parse(recipe);
    expect(result.description).toBe('');
  });
});
```

### 2. AI Generation Tests
```typescript
// Test that descriptions are used for image generation
describe('AI Image Generation with Description', () => {
  it('should use description for image prompts', () => {
    const recipe = {
      title: 'Simple Pasta',
      description: 'A rich, creamy carbonara with crispy pancetta and velvety egg sauce',
      ingredients: ['pasta', 'eggs', 'pancetta'],
      instructions: 'Cook pasta...'
    };
    
    const prompt = generateIntelligentPrompt(recipe);
    expect(prompt.basePrompt).toContain('creamy carbonara');
    expect(prompt.basePrompt).toContain('crispy pancetta');
  });
});
```

## ✅ Phase 0 Completion Criteria

- [ ] Recipe schema updated to include description field
- [ ] AI personas generate rich descriptions
- [ ] Recipe form displays and edits descriptions
- [ ] Recipe view prominently shows descriptions
- [ ] Database schema supports descriptions
- [ ] Image generation uses descriptions as prompts
- [ ] All tests pass
- [ ] Backward compatibility maintained

## 🚀 Integration with Existing Plan

This Phase 0 enhancement **perfectly complements** the existing AI image generation plan:

1. **Phase 1**: Backend API can use descriptions as primary prompts
2. **Phase 2**: Frontend can auto-populate prompts from descriptions
3. **Phase 3**: Context analysis enhanced with rich description data
4. **Phase 4**: Cost optimization considers description quality
5. **Phase 5**: Testing validates description-based image generation

The description field acts as the **bridge** between user intent and AI image generation, making the entire system more intelligent and user-friendly.

---

**Estimated Time**: 1-2 days
**Dependencies**: None (foundational enhancement)
**Risk Level**: Low (additive feature, backward compatible)
