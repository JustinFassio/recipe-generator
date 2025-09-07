import { describe, it, expect } from 'vitest';
import { buildUserContextPrompt } from '../userPreferencesToPrompt';
import type { UserPreferencesForAI } from '../userPreferencesToPrompt';

describe('Bio Integration with AI Agents', () => {
  it('should include bio in user context prompt when provided', () => {
    const userData: UserPreferencesForAI = {
      profile: {
        bio: 'I love experimenting with Mediterranean and Asian fusion cuisine. I enjoy cooking for my family and trying new techniques.',
        region: 'North America',
        units: 'imperial',
        time_per_meal: 45,
        skill_level: 'intermediate',
      },
      safety: {
        allergies: ['tree nuts'],
        dietary_restrictions: ['lactose intolerant'],
        medical_conditions: [],
      },
      cooking: {
        preferred_cuisines: ['mediterranean', 'japanese'],
        available_equipment: ['oven', 'stovetop'],
        disliked_ingredients: ['brussels sprouts'],
        spice_tolerance: 3,
      },
    };

    const contextPrompt = buildUserContextPrompt(userData);

    expect(contextPrompt).toContain(
      'User Bio: I love experimenting with Mediterranean and Asian fusion cuisine'
    );
    expect(contextPrompt).toContain(
      'CRITICAL: User has allergies to: tree nuts'
    );
    expect(contextPrompt).toContain(
      'Preferred cuisines: mediterranean, japanese'
    );
    expect(contextPrompt).toContain('Skill level: intermediate');
  });

  it('should handle missing bio gracefully', () => {
    const userData: UserPreferencesForAI = {
      profile: {
        region: 'North America',
        units: 'imperial',
        time_per_meal: 45,
        skill_level: 'intermediate',
      },
      safety: {
        allergies: [],
        dietary_restrictions: [],
        medical_conditions: [],
      },
      cooking: {
        preferred_cuisines: ['mediterranean'],
        available_equipment: ['oven'],
        disliked_ingredients: [],
        spice_tolerance: 3,
      },
    };

    const contextPrompt = buildUserContextPrompt(userData);

    expect(contextPrompt).not.toContain('User Bio:');
    expect(contextPrompt).toContain('Skill level: intermediate');
    expect(contextPrompt).toContain('Preferred cuisines: mediterranean');
  });

  it('should handle empty bio string', () => {
    const userData: UserPreferencesForAI = {
      profile: {
        bio: '',
        region: 'North America',
        units: 'imperial',
        time_per_meal: 45,
        skill_level: 'intermediate',
      },
      safety: {
        allergies: [],
        dietary_restrictions: [],
        medical_conditions: [],
      },
      cooking: {
        preferred_cuisines: ['mediterranean'],
        available_equipment: ['oven'],
        disliked_ingredients: [],
        spice_tolerance: 3,
      },
    };

    const contextPrompt = buildUserContextPrompt(userData);

    expect(contextPrompt).not.toContain('User Bio:');
    expect(contextPrompt).toContain('Skill level: intermediate');
  });

  it('should include bio in the correct position in the prompt', () => {
    const userData: UserPreferencesForAI = {
      profile: {
        bio: 'Test bio content',
        region: 'North America',
        units: 'imperial',
        time_per_meal: 45,
        skill_level: 'intermediate',
      },
      safety: {
        allergies: ['tree nuts'],
        dietary_restrictions: [],
        medical_conditions: [],
      },
      cooking: {
        preferred_cuisines: ['mediterranean'],
        available_equipment: ['oven'],
        disliked_ingredients: [],
        spice_tolerance: 3,
      },
    };

    const contextPrompt = buildUserContextPrompt(userData);
    const lines = contextPrompt.split('\n');

    // Bio should appear after safety section but before other profile preferences
    const bioIndex = lines.findIndex((line) => line.includes('User Bio:'));
    const skillIndex = lines.findIndex((line) => line.includes('Skill level:'));
    const allergyIndex = lines.findIndex((line) =>
      line.includes('CRITICAL: User has allergies')
    );

    expect(bioIndex).toBeGreaterThan(allergyIndex);
    expect(bioIndex).toBeLessThan(skillIndex);
  });
});
