/**
 * Phase 4 Demo Component
 * Tests and showcases the AI integration functionality
 */

import React, { useState, useEffect } from 'react';
import {
  getUserDataForAI,
  buildEnhancedAIPrompt,
  quickSafetyCheck,
  validateRecipeForUser,
  generatePersonalizedCookingTips,
  type UserPreferencesForAI,
} from '../../lib/ai';

const Phase4Demo: React.FC = () => {
  const [userData, setUserData] = useState<UserPreferencesForAI | null>(null);
  const [demoRecipe] = useState({
    title: 'Spicy Thai Curry with Shrimp',
    ingredients: ['shrimp', 'coconut milk', 'curry paste', 'vegetables', 'rice'],
    instructions: 'Cook rice, sauté shrimp, add curry paste and coconut milk, simmer with vegetables',
    notes: 'Spicy dish with medium heat level. Serves 4 people.',
  });
  const [validationResults, setValidationResults] = useState<Record<string, unknown> | null>(null);
  const [cookingTips, setCookingTips] = useState<string[]>([]);

  useEffect(() => {
    // Load mock user data
    const loadUserData = async () => {
      const data = await getUserDataForAI('demo-user');
      setUserData(data);
      
      // Generate cooking tips
      const tips = generatePersonalizedCookingTips(data);
      setCookingTips(tips);
    };

    loadUserData();
  }, []);

  const testSafetyCheck = () => {
    if (!userData) return;
    
    const safetyResult = quickSafetyCheck(demoRecipe.ingredients, userData);
    setValidationResults({
      type: 'Safety Check',
      result: safetyResult,
    });
  };

  const testFullValidation = () => {
    if (!userData) return;
    
    const validationResult = validateRecipeForUser(demoRecipe, userData);
    setValidationResults({
      type: 'Full Validation',
      result: validationResult,
    });
  };

  const testEnhancedPrompt = () => {
    if (!userData) return;
    
    const basePrompt = 'You are a helpful cooking assistant.';
    const userRequest = 'Create a healthy dinner recipe';
    const enhancedPrompt = buildEnhancedAIPrompt(basePrompt, userRequest, userData);
    
    setValidationResults({
      type: 'Enhanced AI Prompt',
      result: { 
        prompt: enhancedPrompt,
        originalLength: basePrompt.length,
        enhancedLength: enhancedPrompt.length,
        userDataSummary: {
          allergies: userData.safety.allergies,
          restrictions: userData.safety.dietary_restrictions,
          skillLevel: userData.profile.skill_level,
          timeConstraint: userData.profile.time_per_meal,
        }
      },
    });
  };

  if (!userData) {
    return <div className="p-4">Loading user data...</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Phase 4: AI Integration Demo</h1>
      
      {/* User Data Display */}
      <div className="bg-base-200 p-4 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-3">Current User Data</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <h3 className="font-medium">Profile</h3>
            <p>Region: {userData.profile.region}</p>
            <p>Skill: {userData.profile.skill_level}</p>
            <p>Time: {userData.profile.time_per_meal} min</p>
          </div>
          <div>
            <h3 className="font-medium">Safety</h3>
            <p>Allergies: {userData.safety.allergies.join(', ')}</p>
            <p>Restrictions: {userData.safety.dietary_restrictions.join(', ')}</p>
          </div>
          <div>
            <h3 className="font-medium">Cooking</h3>
            <p>Cuisines: {userData.cooking.preferred_cuisines.join(', ')}</p>
            <p>Equipment: {userData.cooking.available_equipment.join(', ')}</p>
          </div>
        </div>
      </div>

      {/* Demo Recipe */}
      <div className="bg-base-200 p-4 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-3">Demo Recipe</h2>
        <h3 className="font-medium">{demoRecipe.title}</h3>
        <p><strong>Ingredients:</strong> {demoRecipe.ingredients.join(', ')}</p>
        <p><strong>Instructions:</strong> {demoRecipe.instructions}</p>
        <p><strong>Notes:</strong> {demoRecipe.notes}</p>
      </div>

      {/* Test Buttons */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={testSafetyCheck}
          className="btn btn-primary"
        >
          Test Safety Check
        </button>
        <button
          onClick={testFullValidation}
          className="btn btn-secondary"
        >
          Test Full Validation
        </button>
        <button
          onClick={testEnhancedPrompt}
          className="btn btn-accent"
        >
          Test Enhanced AI Prompt
        </button>
      </div>

      {/* Results Display */}
      {validationResults && (
        <div className="bg-base-200 p-4 rounded-lg mb-6">
          <h2 className="text-xl font-semibold mb-3">{validationResults.type}</h2>
          <pre className="bg-base-300 p-3 rounded text-sm overflow-x-auto">
            {JSON.stringify(validationResults.result, null, 2)}
          </pre>
        </div>
      )}

      {/* Cooking Tips */}
      <div className="bg-base-200 p-4 rounded-lg">
        <h2 className="text-xl font-semibold mb-3">Personalized Cooking Tips</h2>
        <ul className="list-disc list-inside space-y-2">
          {cookingTips.map((tip, index) => (
            <li key={index} className="text-sm">{tip}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Phase4Demo;
