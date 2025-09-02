import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import CategoryChip from '@/components/ui/CategoryChip';
import {
  searchCuisines,
  getCuisineContext,
  suggestCuisinesByIngredients,
  getComplementaryCuisines,
  generateRecipeCategories,
  getCoverageStats,
  type CuisineSuggestion,
  type RegionalCuisineContext,
} from '@/lib/ai-agents/cuisine-agent';

// Define types for the demo component
interface CoverageStats {
  totalCuisines: number;
  totalCountries: number;
  coveragePercentage: number;
  regionalBreakdown: Array<{
    region: string;
    cuisineCount: number;
    percentage: number;
  }>;
}

export function CuisineAgentDemo() {
  const [searchQuery, setSearchQuery] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState('');
  const [searchResults, setSearchResults] = useState<CuisineSuggestion[]>([]);
  const [cuisineContext, setCuisineContext] =
    useState<RegionalCuisineContext | null>(null);
  const [ingredientSuggestions, setIngredientSuggestions] = useState<
    CuisineSuggestion[]
  >([]);
  const [complementaryCuisines, setComplementaryCuisines] = useState<
    CuisineSuggestion[]
  >([]);
  const [recipeCategories, setRecipeCategories] = useState<string[]>([]);
  const [coverageStats, setCoverageStats] = useState<CoverageStats | null>(
    null
  );

  const handleSearch = () => {
    if (searchQuery.trim()) {
      const results = searchCuisines(searchQuery);
      setSearchResults(results);
    }
  };

  const handleGetContext = (cuisine: string) => {
    const context = getCuisineContext(cuisine);
    setCuisineContext(context);
    setSelectedCuisine(cuisine);
  };

  const handleIngredientSearch = () => {
    if (ingredients.trim()) {
      const ingredientList = ingredients.split(',').map((i) => i.trim());
      const suggestions = suggestCuisinesByIngredients(ingredientList);
      setIngredientSuggestions(suggestions);
    }
  };

  const handleGetComplementary = (cuisine: string) => {
    const complementary = getComplementaryCuisines(cuisine);
    setComplementaryCuisines(complementary);
  };

  const handleGenerateCategories = (cuisine: string) => {
    const categories = generateRecipeCategories(cuisine);
    setRecipeCategories(categories);
  };

  const handleGetStats = () => {
    const stats = getCoverageStats();
    setCoverageStats(stats);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="border rounded-lg p-6">
        <div className="mb-4">
          <h1 className="text-2xl font-bold">🌍 AI Cuisine Agent Demo</h1>
        </div>
        <div>
          <p className="text-gray-600 mb-4">
            This demo showcases the AI agent's ability to work with the
            comprehensive regional cuisine system.
          </p>

          {/* Coverage Stats */}
          <div className="mb-6">
            <Button onClick={handleGetStats} variant="outline" className="mb-2">
              Get Coverage Statistics
            </Button>
            {coverageStats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {coverageStats.totalCuisines}
                  </div>
                  <div className="text-sm text-blue-800">Total Cuisines</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {coverageStats.coveragePercentage}%
                  </div>
                  <div className="text-sm text-green-800">World Coverage</div>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {coverageStats.totalCountries}
                  </div>
                  <div className="text-sm text-purple-800">Total Countries</div>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {coverageStats.regionalBreakdown.length}
                  </div>
                  <div className="text-sm text-orange-800">Regions</div>
                </div>
              </div>
            )}
          </div>

          {/* Cuisine Search */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">🔍 Search Cuisines</h3>
            <div className="flex gap-2 mb-3">
              <Input
                placeholder="Search for cuisines..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleSearch}>Search</Button>
            </div>
            {searchResults.length > 0 && (
              <div className="space-y-2">
                {searchResults.map((result, index) => (
                  <div key={index} className="p-3 border rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="font-semibold">{result.cuisine}</span>
                        <CategoryChip
                          category={result.region}
                          variant="default"
                          size="sm"
                          className="ml-2"
                        />
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Confidence: {(result.confidence * 100).toFixed(0)}%
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {result.description}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {result.reasoning}
                    </p>
                    <div className="flex gap-2 mt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleGetContext(result.cuisine)}
                      >
                        Get Context
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleGetComplementary(result.cuisine)}
                      >
                        Complementary
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleGenerateCategories(result.cuisine)}
                      >
                        Generate Categories
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Ingredient-based Suggestions */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">
              🥘 Find Cuisines by Ingredients
            </h3>
            <div className="flex gap-2 mb-3">
              <Input
                placeholder="Enter ingredients (comma-separated)..."
                value={ingredients}
                onChange={(e) => setIngredients(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleIngredientSearch}>Find Cuisines</Button>
            </div>
            {ingredientSuggestions.length > 0 && (
              <div className="space-y-2">
                {ingredientSuggestions.map((suggestion, index) => (
                  <div key={index} className="p-3 border rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-semibold">
                          {suggestion.cuisine}
                        </span>
                        <CategoryChip
                          category={suggestion.region}
                          variant="default"
                          size="sm"
                          className="ml-2"
                        />
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Match: {(suggestion.confidence * 100).toFixed(0)}%
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {suggestion.reasoning}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cuisine Context */}
          {cuisineContext && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">
                📚 Cuisine Context: {selectedCuisine}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Cultural Notes</h4>
                  <ul className="text-sm space-y-1">
                    {cuisineContext.culturalNotes.map(
                      (note: string, index: number) => (
                        <li key={index} className="text-muted-foreground">
                          • {note}
                        </li>
                      )
                    )}
                  </ul>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Common Ingredients</h4>
                  <div className="flex flex-wrap gap-1">
                    {cuisineContext.commonIngredients.map(
                      (ingredient: string, index: number) => (
                        <CategoryChip
                          key={index}
                          category={ingredient}
                          variant="default"
                          size="sm"
                        />
                      )
                    )}
                  </div>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Cooking Techniques</h4>
                  <div className="flex flex-wrap gap-1">
                    {cuisineContext.cookingTechniques.map(
                      (technique: string, index: number) => (
                        <CategoryChip
                          key={index}
                          category={technique}
                          variant="default"
                          size="sm"
                        />
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Complementary Cuisines */}
          {complementaryCuisines.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">
                🔄 Complementary Cuisines
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {complementaryCuisines.map((cuisine, index) => (
                  <div key={index} className="p-3 border rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-semibold">{cuisine.cuisine}</span>
                        <CategoryChip
                          category={cuisine.region}
                          variant="default"
                          size="sm"
                          className="ml-2"
                        />
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {(cuisine.confidence * 100).toFixed(0)}%
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {cuisine.reasoning}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Generated Recipe Categories */}
          {recipeCategories.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">
                🏷️ Generated Recipe Categories
              </h3>
              <div className="flex flex-wrap gap-2">
                {recipeCategories.map((category, index) => (
                  <CategoryChip
                    key={index}
                    category={category}
                    variant="default"
                    size="sm"
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
