import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CuisineCategorySelector } from '@/components/chat/cuisine-category-selector';

interface Selection {
  categories: string[];
  cuisines: string[];
}

export function CuisineCategorySelectorDemo() {
  const [selection, setSelection] = useState<Selection>({
    categories: [],
    cuisines: [],
  });

  const [chatPrompt, setChatPrompt] = useState('');

  const handleSelectionChange = (newSelection: Selection) => {
    setSelection(newSelection);
    generateChatPrompt(newSelection);
  };

  const generateChatPrompt = (sel: Selection) => {
    let prompt = 'Create a recipe';

    if (sel.cuisines.length > 0) {
      prompt += ` with ${sel.cuisines.join(', ')} cuisine`;
      if (sel.cuisines.length > 1) prompt += 's';
    }

    if (sel.categories.length > 0) {
      prompt += ` that is ${sel.categories.join(', ')}`;
    }

    prompt += '.';

    setChatPrompt(prompt);
  };

  const handleGenerateRecipe = () => {
    // This would integrate with your AI recipe generation system
    const fullPrompt = `${chatPrompt}\n\nPlease include detailed instructions, ingredients, and cooking tips.`;
    console.log('AI Recipe Generation Prompt:', fullPrompt);

    // Here you would send this to your recipe assistant
    alert(`Recipe generation prompt sent to AI:\n\n${fullPrompt}`);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="border rounded-lg p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">
            🍳 Cuisine & Category Selector Demo
          </h1>
          <p className="text-gray-600">
            This component looks exactly like the filter bar on the recipes
            page, but instead of filtering recipes, it adds selected categories
            and cuisines to the chat prompt for AI recipe generation.
          </p>
        </div>

        {/* Cuisine & Category Selector */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3">
            Select Categories & Cuisines
          </h2>
          <CuisineCategorySelector
            onSelectionChange={handleSelectionChange}
            className="border rounded-lg p-4 bg-white"
          />
        </div>

        {/* Current Selection Display */}
        {selection.categories.length > 0 || selection.cuisines.length > 0 ? (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Current Selection</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold mb-2">
                  Categories ({selection.categories.length})
                </h4>
                {selection.categories.length > 0 ? (
                  <ul className="space-y-1">
                    {selection.categories.map((category, index) => (
                      <li key={index} className="text-sm text-gray-600">
                        • {category}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-400">
                    No categories selected
                  </p>
                )}
              </div>

              <div className="border rounded-lg p-4">
                <h4 className="font-semibold mb-2">
                  Cuisines ({selection.cuisines.length})
                </h4>
                {selection.cuisines.length > 0 ? (
                  <ul className="space-y-1">
                    {selection.cuisines.map((cuisine, index) => (
                      <li key={index} className="text-sm text-gray-600">
                        • {cuisine}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-400">No cuisines selected</p>
                )}
              </div>
            </div>
          </div>
        ) : null}

        {/* Generated Chat Prompt */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Generated Chat Prompt</h3>
          <div className="border rounded-lg p-4 bg-gray-50">
            <p className="text-sm text-gray-700 font-mono">
              {chatPrompt ||
                'Select categories and cuisines to generate a prompt...'}
            </p>
          </div>
        </div>

        {/* AI Recipe Generation */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">AI Recipe Generation</h3>
          <div className="border rounded-lg p-4 bg-blue-50">
            <p className="text-sm text-blue-800 mb-3">
              When you click "Generate Recipe", this prompt will be sent to your
              AI recipe assistant (Chef Marco, Dr. Sarah, Aunt Jenny, or Dr.
              Sage Vitalis) to create a recipe with your selected preferences.
            </p>
            <Button
              onClick={handleGenerateRecipe}
              disabled={!chatPrompt}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              🚀 Generate Recipe with AI
            </Button>
          </div>
        </div>

        {/* Integration Example */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Integration Example</h3>
          <div className="border rounded-lg p-4 bg-green-50">
            <h4 className="font-semibold mb-2 text-green-800">
              How This Integrates with Your Recipe Assistants:
            </h4>
            <div className="space-y-2 text-sm text-green-700">
              <p>
                • <strong>Chef Marco:</strong> Gets cultural context and
                traditional techniques for selected cuisines
              </p>
              <p>
                • <strong>Dr. Sarah:</strong> Receives nutritional insights for
                the selected categories and cuisines
              </p>
              <p>
                • <strong>Aunt Jenny:</strong> Gets family-friendly adaptations
                for the chosen cuisine styles
              </p>
              <p>
                • <strong>Dr. Sage Vitalis:</strong> Uses AI-powered analysis of
                your selections for personalized recommendations
              </p>
            </div>
          </div>
        </div>

        {/* Technical Details */}
        <div>
          <h3 className="text-lg font-semibold mb-3">
            Technical Implementation
          </h3>
          <div className="border rounded-lg p-4 bg-gray-50">
            <h4 className="font-semibold mb-2">
              What Happens When You Select:
            </h4>
            <div className="space-y-2 text-sm text-gray-700">
              <p>
                1. <strong>Categories:</strong> Uses the same CategoryFilter
                component from your recipes page
              </p>
              <p>
                2. <strong>Cuisines:</strong> Uses the new CuisineFilter with
                134 regional cuisines
              </p>
              <p>
                3. <strong>Prompt Generation:</strong> Automatically creates a
                natural language prompt
              </p>
              <p>
                4. <strong>AI Integration:</strong> Sends the prompt to your
                recipe assistant system
              </p>
              <p>
                5. <strong>Recipe Creation:</strong> AI generates a recipe
                matching your selections
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
