import { describe, it, expect } from 'vitest';
import { CuisineStaplesManager } from '@/lib/shopping-cart/cuisine-staples';
import { IngredientMatcher } from '@/lib/groceries/ingredient-matcher';

describe('CuisineStaplesManager', () => {
  it('should get available cuisines', () => {
    const manager = new CuisineStaplesManager();
    const cuisines = manager.getAvailableCuisines();

    expect(cuisines).toContain('mexican');
    expect(cuisines).toContain('italian');
    expect(cuisines).toContain('asian');
  });

  it('should get cuisine staples', () => {
    const manager = new CuisineStaplesManager();
    const mexicanStaples = manager.getCuisineStaples('mexican');

    expect(mexicanStaples).toHaveLength(11); // Based on our data
    expect(mexicanStaples[0].ingredient).toBe('cumin');
    expect(mexicanStaples[0].priority).toBe('essential');
    expect(mexicanStaples[0].category).toBe('flavor_builders');
  });

  it('should find missing staples for Mexican cuisine', () => {
    const manager = new CuisineStaplesManager();
    const matcher = new IngredientMatcher({
      flavor_builders: ['paprika'], // User has paprika but missing other essentials
      fresh_produce: ['onion', 'garlic'], // User has some basics
    });

    const missing = manager.findMissingStaples(
      'mexican',
      {
        flavor_builders: ['paprika'],
        fresh_produce: ['onion', 'garlic'],
      },
      matcher
    );

    expect(missing.cuisine).toBe('Mexican');
    expect(missing.missing.length).toBeGreaterThan(0);
    expect(missing.available.length).toBeGreaterThan(0);
    expect(missing.coverage).toBeGreaterThan(0);
    expect(missing.coverage).toBeLessThan(100);
  });

  it('should find missing staples for Italian cuisine', () => {
    const manager = new CuisineStaplesManager();
    const matcher = new IngredientMatcher({
      fresh_produce: ['tomato', 'garlic'],
      dairy_cold: ['cheese'],
    });

    const missing = manager.findMissingStaples(
      'italian',
      {
        fresh_produce: ['tomato', 'garlic'],
        dairy_cold: ['cheese'],
      },
      matcher
    );

    expect(missing.cuisine).toBe('Italian');
    expect(missing.missing.length).toBeGreaterThan(0);
    expect(missing.available.length).toBeGreaterThan(0);
  });

  it('should get recommended additions', () => {
    const manager = new CuisineStaplesManager();
    const matcher = new IngredientMatcher({
      fresh_produce: ['onion', 'garlic'], // User has basics
    });

    const recommendations = manager.getRecommendedAdditions(
      'mexican',
      {
        fresh_produce: ['onion', 'garlic'],
      },
      matcher,
      3
    );

    expect(recommendations.length).toBeLessThanOrEqual(3);
    expect(recommendations.length).toBeGreaterThan(0);

    // Should prioritize essential ingredients
    const essentialCount = recommendations.filter(
      (r) => r.priority === 'essential'
    ).length;
    expect(essentialCount).toBeGreaterThan(0);
  });

  it('should get all missing staples', () => {
    const manager = new CuisineStaplesManager();
    const matcher = new IngredientMatcher({
      fresh_produce: ['onion', 'garlic'],
      flavor_builders: ['paprika'],
    });

    const allMissing = manager.getAllMissingStaples(
      {
        fresh_produce: ['onion', 'garlic'],
        flavor_builders: ['paprika'],
      },
      matcher
    );

    expect(allMissing.length).toBeGreaterThan(0);
    expect(allMissing.every((m) => m.missing.length > 0)).toBe(true);
  });

  it('should handle empty groceries', () => {
    const manager = new CuisineStaplesManager();
    const matcher = new IngredientMatcher({});

    const missing = manager.findMissingStaples('mexican', {}, matcher);

    expect(missing.cuisine).toBe('Mexican');
    expect(missing.missing.length).toBeGreaterThan(0);
    expect(missing.available.length).toBe(0);
    expect(missing.coverage).toBe(0);
  });

  it('should handle unknown cuisine', () => {
    const manager = new CuisineStaplesManager();
    const matcher = new IngredientMatcher({});

    const missing = manager.findMissingStaples('unknown', {}, matcher);

    expect(missing.cuisine).toBe('unknown');
    expect(missing.missing).toEqual([]);
    expect(missing.available).toEqual([]);
    expect(missing.coverage).toBe(0);
  });
});
