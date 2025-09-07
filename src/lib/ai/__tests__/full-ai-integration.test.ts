import { describe, it, expect } from 'vitest';
import {
  buildEnhancedAIPrompt,
  buildEnhancedAIPromptWithOverrides,
} from '../index';
import type { UserPreferencesForAI } from '../userPreferencesToPrompt';

describe('Full AI Integration with Bio Field', () => {
  it('should include bio in enhanced AI prompt', () => {
    const userData: UserPreferencesForAI = {
      profile: {
        bio: "I love experimenting with Mediterranean and Asian fusion cuisine. I enjoy cooking for my family and trying new techniques. I'm particularly interested in healthy, plant-based meals that are quick to prepare during weekdays.",
        region: 'North America',
        units: 'imperial',
        time_per_meal: 45,
        skill_level: 'intermediate',
      },
      safety: {
        allergies: ['tree nuts', 'shellfish'],
        dietary_restrictions: ['lactose intolerant'],
        medical_conditions: ['prediabetes'],
      },
      cooking: {
        preferred_cuisines: ['mediterranean', 'japanese', 'mexican'],
        available_equipment: ['oven', 'stovetop', 'blender', 'slow cooker'],
        disliked_ingredients: ['brussels sprouts', 'liver', 'blue cheese'],
        spice_tolerance: 3,
      },
    };

    const basePrompt = 'You are a helpful cooking assistant.';
    const userRequest = 'Help me plan a healthy dinner.';

    const enhancedPrompt = buildEnhancedAIPrompt(
      basePrompt,
      userRequest,
      userData
    );

    // Check that bio is included in the prompt
    expect(enhancedPrompt).toContain(
      'User Bio: I love experimenting with Mediterranean and Asian fusion cuisine'
    );

    // Check that other user data is included
    expect(enhancedPrompt).toContain(
      'CRITICAL: User has allergies to: tree nuts, shellfish'
    );
    expect(enhancedPrompt).toContain(
      'Preferred cuisines: mediterranean, japanese, mexican'
    );
    expect(enhancedPrompt).toContain('Skill level: intermediate');
    expect(enhancedPrompt).toContain('Spice tolerance: 3/5');

    // Check that the prompt structure is correct
    expect(enhancedPrompt).toContain(
      'USER REQUEST: Help me plan a healthy dinner.'
    );
    expect(enhancedPrompt).toContain('USER CONTEXT:');
    expect(enhancedPrompt).toContain('CULTURAL PREFERENCES:');
    expect(enhancedPrompt).toContain('IMPORTANT REQUIREMENTS:');

    // Check that bio appears in the right section
    const userContextSection =
      enhancedPrompt
        .split('USER CONTEXT:')[1]
        ?.split('CULTURAL PREFERENCES:')[0] || '';
    expect(userContextSection).toContain(
      'User Bio: I love experimenting with Mediterranean and Asian fusion cuisine'
    );
  });

  it('should handle bio with special characters and formatting', () => {
    const userData: UserPreferencesForAI = {
      profile: {
        bio: "I'm a passionate home cook who loves Italian cuisine! I enjoy making pasta from scratch and experimenting with traditional recipes. My family has Italian heritage, so I'm particularly drawn to authentic flavors and techniques.",
        region: 'North America',
        units: 'imperial',
        time_per_meal: 60,
        skill_level: 'advanced',
      },
      safety: {
        allergies: [],
        dietary_restrictions: [],
        medical_conditions: [],
      },
      cooking: {
        preferred_cuisines: ['italian'],
        available_equipment: ['pasta machine', 'stand mixer'],
        disliked_ingredients: [],
        spice_tolerance: 2,
      },
    };

    const basePrompt = 'You are a helpful cooking assistant.';
    const userRequest = 'Suggest an Italian recipe.';

    const enhancedPrompt = buildEnhancedAIPrompt(
      basePrompt,
      userRequest,
      userData
    );

    // Check that bio with special characters is properly included
    expect(enhancedPrompt).toContain(
      "User Bio: I'm a passionate home cook who loves Italian cuisine!"
    );
    expect(enhancedPrompt).toContain(
      'I enjoy making pasta from scratch and experimenting with traditional recipes'
    );
    expect(enhancedPrompt).toContain('My family has Italian heritage');
  });

  it('should work with live selection overrides and include bio', () => {
    const userData: UserPreferencesForAI = {
      profile: {
        bio: "I love quick and easy weeknight meals. I'm always looking for healthy options that can be prepared in under 30 minutes.",
        region: 'North America',
        units: 'imperial',
        time_per_meal: 30,
        skill_level: 'beginner',
      },
      safety: {
        allergies: ['peanuts'],
        dietary_restrictions: ['vegetarian'],
        medical_conditions: [],
      },
      cooking: {
        preferred_cuisines: ['american', 'mexican'],
        available_equipment: ['microwave', 'toaster oven'],
        disliked_ingredients: ['mushrooms'],
        spice_tolerance: 1,
      },
    };

    const liveSelections = {
      categories: ['Quick & Easy'],
      cuisines: ['thai', 'indian'],
      moods: ['comforting'],
    };

    const basePrompt = 'You are a helpful cooking assistant.';
    const userRequest = 'I want something quick and comforting.';

    const enhancedPrompt = buildEnhancedAIPromptWithOverrides(
      basePrompt,
      userRequest,
      userData,
      liveSelections
    );

    // Check that bio is still included
    expect(enhancedPrompt).toContain(
      'User Bio: I love quick and easy weeknight meals'
    );

    // Check that live selections override account preferences
    expect(enhancedPrompt).toContain(
      'LIVE MEAL PREFERENCES (Override account preferences):'
    );
    expect(enhancedPrompt).toContain(
      '**Cuisines:** thai, indian (Override: american, mexican)'
    );
    expect(enhancedPrompt).toContain('**Categories:** Quick & Easy');
    expect(enhancedPrompt).toContain('**Moods:** comforting');

    // Check that safety information is still present
    expect(enhancedPrompt).toContain(
      'CRITICAL: User has allergies to: peanuts'
    );
    expect(enhancedPrompt).toContain('Dietary restrictions: vegetarian');
  });
});
