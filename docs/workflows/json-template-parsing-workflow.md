# JSON Template Parsing Workflow

**Complete guide to the JSON template system for recipe parsing and display**

---

## 🎯 **Overview**

The JSON Template Parsing Workflow is the core system that transforms AI-generated recipe content into structured data that can be displayed in the Recipe Generator application. This workflow handles multiple JSON formats, complex nested structures, and provides fallback parsing for non-JSON content.

## 🔄 **Workflow Diagram**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  AI Response    │───▶│  JSON Template  │───▶│  Parse Recipe   │
│  (Text/Markdown)│    │  Detection      │    │  from Text      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                       │
                                ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Template       │◀───│  Structure      │◀───│  Recipe Form    │
│  Validation     │    │  Normalization  │    │  Data Creation  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Recipe View    │◀───│  Database       │◀───│  Save Recipe    │
│  Component      │    │  Storage        │    │  to Collection  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📋 **JSON Template Structure**

### **1. Basic JSON Template**

The primary JSON template is defined in the OpenAI persona configurations:

```json
{
  "title": "Recipe Name",
  "ingredients": ["ingredient 1", "ingredient 2"],
  "instructions": "Step-by-step cooking instructions",
  "notes": "Tips, variations, and additional notes"
}
```

### **2. Advanced JSON Template**

The parsing system also supports complex nested structures:

```json
{
  "title": "Recipe Name",
  "ingredients": {
    "main": ["2 cups all-purpose flour", "1 cup sugar"],
    "sauce": ["1/2 cup olive oil", "2 cloves garlic"],
    "toppings": ["1/4 cup cheese", "Fresh herbs"]
  },
  "basic_instructions": ["Preheat oven to 350°F", "Prepare baking sheet"],
  "instructions": [
    "Mix dry ingredients",
    "Add wet ingredients",
    "Bake for 25 minutes"
  ],
  "tips_and_tricks": [
    "Use room temperature ingredients",
    "Don't overmix the batter"
  ],
  "substitutions": [
    "Butter can be replaced with oil",
    "Sugar can be reduced by 1/4"
  ],
  "pairings": ["Serve with fresh fruit", "Great with coffee or tea"],
  "servings": "4-6 people",
  "notes": "Additional cooking notes and variations"
}
```

### **3. Structured Ingredient Objects**

For precise ingredient formatting:

```json
{
  "ingredients": [
    {
      "item": "all-purpose flour",
      "amount": "2 cups",
      "prep": "sifted"
    },
    {
      "item": "sugar",
      "amount": "1 cup",
      "prep": "granulated"
    }
  ]
}
```

## 🔧 **Template Sources**

### **1. OpenAI Persona Configurations**

**Location**: `src/lib/openai.ts`

Each persona includes the JSON template in their system prompt:

```typescript
export const RECIPE_BOT_PERSONAS: Record<string, PersonaConfig> = {
  chef: {
    name: 'Chef Marco',
    systemPrompt: `You are Chef Marco, an experienced Italian chef...

When generating a complete recipe, structure it as a JSON object with:
{
  "title": "Recipe Name",
  "ingredients": ["ingredient 1", "ingredient 2"],
  "instructions": "Step-by-step cooking instructions",
  "notes": "Tips, variations, and additional notes"
}`,
  },
  // ... other personas
};
```

### **2. Structured Recipe Generation**

**Location**: `src/lib/openai.ts:generateStructuredRecipe()`

For explicit structured recipe requests:

```typescript
const openAIMessages = [
  {
    role: 'system' as const,
    content:
      personaConfig.systemPrompt +
      '\n\nPlease respond with a valid JSON object containing the complete recipe in this exact format: {"title": "Recipe Name", "ingredients": ["ingredient 1", "ingredient 2"], "instructions": "Step-by-step instructions", "notes": "Additional notes"}',
  },
  // ... conversation messages
];
```

## 🔍 **Parsing Implementation**

### **1. Primary Parsing Function**

**Location**: `src/lib/api.ts:parseRecipeFromText()`

````typescript
export async function parseRecipeFromText(text: string): Promise<{
  title: string;
  ingredients: string[];
  instructions: string;
  notes: string;
}> {
  try {
    console.log('Attempting to parse as JSON...');

    let jsonText = text;

    // Check if JSON is wrapped in markdown code blocks
    const jsonBlockMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonBlockMatch) {
      jsonText = jsonBlockMatch[1];
      console.log('Extracted JSON from markdown code block');
    }

    // Try to parse as JSON first
    const parsed = JSON.parse(jsonText);

    console.log('Successfully parsed JSON format');

    // Validate required fields
    const hasTitle = parsed.title || parsed.name;
    const hasIngredients =
      parsed.ingredients && Array.isArray(parsed.ingredients);
    const hasInstructions = parsed.instructions;

    if (!hasTitle) {
      throw new Error('Missing required field: title or name');
    }
    if (!hasIngredients) {
      throw new Error('Missing required field: ingredients (must be an array)');
    }
    if (!hasInstructions) {
      throw new Error('Missing required field: instructions');
    }

    // Handle complex nested JSON structure
    return processComplexJSON(parsed);
  } catch {
    // Fallback to markdown parsing
    return parseMarkdownRecipe(text);
  }
}
````

### **2. Complex JSON Processing**

**Location**: `src/lib/api.ts` (within `parseRecipeFromText`)

```typescript
// Handle complex nested JSON structure
if (parsed.name || parsed.title) {
  const title = parsed.name || parsed.title || 'Untitled Recipe';
  let ingredients: string[] = [];
  let instructions = '';
  let notes = '';

  // Handle nested ingredients object with categories
  if (parsed.ingredients && typeof parsed.ingredients === 'object') {
    if (Array.isArray(parsed.ingredients)) {
      // Simple array format - convert to strings
      ingredients = parsed.ingredients.map((item: string | IngredientItem) =>
        typeof item === 'string'
          ? item
          : `${item.amount || ''} ${item.item || ''} ${item.prep ? `, ${item.prep}` : ''}`.trim()
      );
    } else {
      // Nested object format with categories
      const categoryOrder = ['main', 'sauce', 'toppings', 'garnish'];
      const allCategories = Object.keys(parsed.ingredients);

      const orderedCategories = [
        ...categoryOrder.filter((cat) => allCategories.includes(cat)),
        ...allCategories.filter((cat) => !categoryOrder.includes(cat)),
      ];

      for (const category of orderedCategories) {
        const items = parsed.ingredients[category];
        if (Array.isArray(items) && items.length > 0) {
          // Add category header
          const categoryTitle = category
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, (str) => str.toUpperCase());
          ingredients.push(`--- ${categoryTitle} ---`);

          // Add ingredients
          for (const item of items) {
            if (typeof item === 'string') {
              ingredients.push(item);
            } else if (typeof item === 'object' && item !== null) {
              const typedItem = item as IngredientItem;
              let ingredientStr = '';
              if (typedItem.amount) ingredientStr += `${typedItem.amount} `;
              if (typedItem.item) ingredientStr += typedItem.item;
              if (typedItem.prep) ingredientStr += `, ${typedItem.prep}`;

              if (ingredientStr.trim()) {
                ingredients.push(ingredientStr.trim());
              }
            }
          }
        }
      }
    }
  }

  // Handle instructions - support both array and string formats
  const instructionParts: string[] = [];

  // Add basic/preparation instructions first
  if (parsed.basic_instructions && Array.isArray(parsed.basic_instructions)) {
    instructionParts.push('**Preparation:**');
    parsed.basic_instructions.forEach((step: string, index: number) => {
      if (step && step.trim()) {
        instructionParts.push(`${index + 1}. ${step.trim()}`);
      }
    });
    instructionParts.push(''); // Add blank line
  }

  // Add main cooking instructions
  if (Array.isArray(parsed.instructions)) {
    if (instructionParts.length > 0) {
      instructionParts.push('**Cooking Instructions:**');
    }
    parsed.instructions.forEach((step: string) => {
      if (step && step.trim()) {
        const cleanStep = step.trim().replace(/^\d+\.\s*/, '');
        instructionParts.push(cleanStep);
      }
    });
  } else if (typeof parsed.instructions === 'string') {
    if (instructionParts.length > 0) {
      instructionParts.push('**Cooking Instructions:**');
    }
    instructionParts.push(parsed.instructions.trim());
  }

  instructions = instructionParts.join('\n');

  // Handle notes - combine various optional sections
  const notesParts: string[] = [];

  // Add servings information
  if (parsed.servings) {
    notesParts.push(`**Servings:** ${parsed.servings}`);
    notesParts.push('');
  }

  // Add tips and tricks
  if (parsed.tips_and_tricks && Array.isArray(parsed.tips_and_tricks)) {
    notesParts.push('**Tips & Tricks:**');
    parsed.tips_and_tricks.forEach((tip: string) => {
      if (tip && tip.trim()) {
        notesParts.push(`• ${tip.trim()}`);
      }
    });
    notesParts.push('');
  }

  // Add substitutions
  if (parsed.substitutions && Array.isArray(parsed.substitutions)) {
    notesParts.push('**Substitutions:**');
    parsed.substitutions.forEach((sub: string) => {
      if (sub && sub.trim()) {
        notesParts.push(`• ${sub.trim()}`);
      }
    });
    notesParts.push('');
  }

  // Add pairings
  if (parsed.pairings && Array.isArray(parsed.pairings)) {
    notesParts.push('**Pairings:**');
    parsed.pairings.forEach((pairing: string) => {
      if (pairing && pairing.trim()) {
        notesParts.push(`• ${pairing.trim()}`);
      }
    });
    notesParts.push('');
  }

  // Add any additional notes
  if (parsed.notes && typeof parsed.notes === 'string') {
    notesParts.push('**Additional Notes:**');
    notesParts.push(parsed.notes.trim());
  }

  notes = notesParts.join('\n').trim();

  return {
    title,
    ingredients,
    instructions,
    notes,
  };
}
```

### **3. Markdown Fallback Parsing**

**Location**: `src/lib/api.ts` (within `parseRecipeFromText`)

```typescript
// If not JSON, treat as markdown and do basic parsing
const processedLines = processedText.split('\n').filter((line) => line.trim());

let title = 'Untitled Recipe';
const ingredients: string[] = [];
let instructions = '';
let notes = '';

let currentSection = '';

for (const line of processedLines) {
  const trimmed = line.trim();
  const lowerTrimmed = trimmed.toLowerCase();

  if (trimmed.startsWith('#')) {
    // Only use as title if it looks like a recipe title
    const potentialTitle = trimmed.replace(/^#+\s*/, '');
    if (
      potentialTitle.length > 0 &&
      !lowerTrimmed.includes('implementation') &&
      !lowerTrimmed.includes('outcome')
    ) {
      title = potentialTitle;
    }
  } else if (lowerTrimmed.includes('ingredient')) {
    currentSection = 'ingredients';
  } else if (
    lowerTrimmed.includes('instruction') ||
    lowerTrimmed.includes('direction')
  ) {
    currentSection = 'instructions';
  } else if (lowerTrimmed.includes('note') || lowerTrimmed.includes('tip')) {
    currentSection = 'notes';
  } else if (
    trimmed.startsWith('-') ||
    trimmed.startsWith('*') ||
    trimmed.startsWith('•')
  ) {
    // Bullet point - add to current section
    const content = trimmed.replace(/^[-*•]\s*/, '');
    if (currentSection === 'ingredients') {
      ingredients.push(content);
    } else if (currentSection === 'instructions') {
      instructions += content + '\n';
    } else if (currentSection === 'notes') {
      notes += content + '\n';
    }
  } else if (trimmed.match(/^\d+\./)) {
    // Numbered step - add to instructions
    instructions += trimmed + '\n';
  } else if (trimmed.length > 0) {
    // Regular text - add to current section
    if (currentSection === 'instructions') {
      instructions += trimmed + '\n';
    } else if (currentSection === 'notes') {
      notes += trimmed + '\n';
    }
  }
}

return {
  title,
  ingredients,
  instructions: instructions.trim(),
  notes: notes.trim(),
};
```

## 📊 **Data Type Definitions**

### **1. Recipe Form Data**

**Location**: `src/lib/schemas.ts`

```typescript
export const recipeSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  ingredients: z
    .array(z.string().min(1, 'Ingredient cannot be empty'))
    .min(1, 'At least one ingredient is required'),
  instructions: z.string().min(1, 'Instructions are required'),
  notes: z.string(),
  image_url: z.string().optional(),
});

export type RecipeFormData = z.infer<typeof recipeSchema>;
```

### **2. Database Recipe Type**

**Location**: `src/lib/supabase.ts`

```typescript
export type Recipe = {
  id: string;
  title: string;
  ingredients: string[];
  instructions: string;
  notes: string;
  image_url: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
};
```

### **3. Ingredient Item Interface**

**Location**: `src/lib/api.ts`

```typescript
interface IngredientItem {
  item: string;
  amount?: string;
  prep?: string;
}
```

## 🎨 **Recipe View Display**

### **1. Component Structure**

**Location**: `src/components/recipes/recipe-view.tsx`

The RecipeView component displays the parsed recipe data with:

- **Header Section**: Title, image, metadata
- **Ingredients Section**: Categorized ingredients with visual indicators
- **Instructions Section**: Numbered steps with section headers
- **Notes Section**: Tips, variations, and additional information

### **2. Ingredient Display Logic**

```typescript
{recipe.ingredients.map((ingredient, index) => (
  <div key={index} className="flex items-start">
    {ingredient.startsWith('---') && ingredient.endsWith('---') ? (
      // Category header
      <div className="w-full">
        <div className={createDaisyUISeparatorClasses('horizontal', 'mb-2')} />
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
        <p className="leading-relaxed text-gray-700">{ingredient}</p>
      </>
    )}
  </div>
))}
```

### **3. Instructions Display Logic**

```typescript
{recipe.instructions.split('\n').map((line, index) => {
  const trimmedLine = line.trim();

  if (!trimmedLine) return null;

  // Check if it's a section header (starts with **)
  if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**')) {
    return (
      <div key={index} className="mt-6 first:mt-0">
        <div className={createDaisyUISeparatorClasses('horizontal', 'mb-3')} />
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
```

## 🔄 **Data Flow Pipeline**

### **1. AI Response to JSON**

```
AI Response (Text/Markdown)
    ↓
JSON Template Detection
    ↓
JSON Parsing & Validation
    ↓
Structure Normalization
    ↓
RecipeFormData Object
```

### **2. Recipe Form to Database**

```
RecipeFormData
    ↓
Zod Schema Validation
    ↓
Supabase Database Insert
    ↓
Recipe Type Object
    ↓
RecipeView Component Display
```

### **3. Template Flexibility**

The system supports multiple input formats:

- **Pure JSON**: Direct JSON objects
- **Markdown JSON**: JSON wrapped in code blocks
- **Structured Markdown**: Traditional recipe format
- **Mixed Content**: JSON with additional text

## 🚨 **Error Handling**

### **1. JSON Parsing Errors**

```typescript
try {
  const parsed = JSON.parse(jsonText);
  // Process parsed data
} catch (error) {
  console.log('JSON parsing failed, trying markdown parsing');
  // Fallback to markdown parsing
  return parseMarkdownRecipe(text);
}
```

### **2. Validation Errors**

```typescript
// Validate required fields
const hasTitle = parsed.title || parsed.name;
const hasIngredients = parsed.ingredients && Array.isArray(parsed.ingredients);
const hasInstructions = parsed.instructions;

if (!hasTitle) {
  throw new Error('Missing required field: title or name');
}
if (!hasIngredients) {
  throw new Error('Missing required field: ingredients (must be an array)');
}
if (!hasInstructions) {
  throw new Error('Missing required field: instructions');
}
```

### **3. Fallback Mechanisms**

- **JSON → Markdown**: If JSON parsing fails, try markdown parsing
- **Complex → Simple**: If complex structure fails, use basic structure
- **Validation → Defaults**: If validation fails, use default values

## 📈 **Performance Optimizations**

### **1. Efficient Parsing**

- **Early Returns**: Exit early on validation failures
- **Single Pass Processing**: Process data in one iteration
- **Memory Management**: Clean up temporary variables

### **2. Caching Strategy**

- **Template Caching**: Cache parsed templates for reuse
- **Validation Caching**: Cache validation results
- **Component Memoization**: Prevent unnecessary re-renders

### **3. Bundle Optimization**

- **Tree Shaking**: Remove unused parsing functions
- **Code Splitting**: Load parsing logic on demand
- **Minification**: Reduce bundle size

## 🧪 **Testing Strategy**

### **1. Unit Tests**

```typescript
// Test JSON parsing
describe('parseRecipeFromText', () => {
  it('should parse basic JSON format');
  it('should parse complex nested JSON');
  it('should handle markdown-wrapped JSON');
  it('should fallback to markdown parsing');
  it('should validate required fields');
});
```

### **2. Integration Tests**

```typescript
// Test complete workflow
describe('JSON Template Workflow', () => {
  it('should parse AI response to recipe form');
  it('should save parsed recipe to database');
  it('should display recipe in view component');
});
```

### **3. Visual Regression Tests**

```typescript
// Test component rendering
describe('RecipeView Component', () => {
  it('should render ingredients with categories');
  it('should render numbered instructions');
  it('should render notes with sections');
});
```

## 📊 **Monitoring & Analytics**

### **1. Parsing Success Metrics**

- **JSON Success Rate**: Percentage of successful JSON parses
- **Fallback Usage**: Frequency of markdown fallback
- **Validation Errors**: Common validation failure types
- **Performance Metrics**: Parsing time and memory usage

### **2. Template Usage Analytics**

- **Template Popularity**: Most used JSON structures
- **Field Completion**: Which fields are most commonly filled
- **Complexity Distribution**: Simple vs complex template usage
- **Error Patterns**: Common parsing failure scenarios

## 🚀 **Future Enhancements**

### **1. Advanced Templates**

- **Multi-language Support**: International recipe formats
- **Dietary Restrictions**: Specialized nutrition templates
- **Cooking Methods**: Technique-specific templates
- **Seasonal Variations**: Time-based recipe adaptations

### **2. AI Integration**

- **Template Learning**: AI learns from user preferences
- **Smart Suggestions**: AI suggests template improvements
- **Auto-completion**: AI fills missing template fields
- **Quality Scoring**: AI rates template completeness

### **3. User Experience**

- **Template Editor**: Visual template creation tool
- **Preview Mode**: Real-time template preview
- **Custom Templates**: User-defined template formats
- **Template Sharing**: Community template library

---

**Related Documentation**:

- [AI Recipe Creation Workflow](ai-recipe-creation-workflow.md)
- [Recipe Save Flow](recipe-save-flow.md)
- [OpenAI Integration Flow](openai-integration-flow.md)
- [State Management Flow](state-management-flow.md)

**Last Updated**: January 2025  
**Status**: ✅ ACTIVE
