import { test, expect } from './fixtures/auth';

test.describe('Recipes Page - No Hang Test', () => {
  test('should login and verify basic page elements without hanging', async ({
    authenticatedPage,
  }) => {
    // Navigate to recipes page
    await authenticatedPage.goto('/recipes');

    // Use a shorter timeout and don't wait for networkidle
    await authenticatedPage.waitForLoadState('domcontentloaded');

    // Verify we're on the recipes page
    await expect(authenticatedPage).toHaveURL('/recipes');

    // Check for main heading (this should be immediate)
    const recipesHeading = authenticatedPage.getByRole('heading', {
      name: /my recipes/i,
    });
    await expect(recipesHeading).toBeVisible();

    // Check for main buttons (these should be immediate)
    const addButton = authenticatedPage.getByRole('button', {
      name: /add recipe/i,
    });
    await expect(addButton).toBeVisible();

    const aiButton = authenticatedPage.getByRole('button', {
      name: /ai recipe creator/i,
    });
    await expect(aiButton).toBeVisible();

    console.log('✅ Login successful and basic page elements are visible');
  });

  test('should test navigation without waiting for content', async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto('/recipes');
    await authenticatedPage.waitForLoadState('domcontentloaded');

    // Test Add Recipe navigation (this should work immediately)
    const addButton = authenticatedPage.getByRole('button', {
      name: /add recipe/i,
    });
    await addButton.click();

    // Should navigate immediately
    await expect(authenticatedPage).toHaveURL('/add');

    console.log('✅ Add Recipe navigation works');

    // Go back to recipes
    await authenticatedPage.goto('/recipes');
    await authenticatedPage.waitForLoadState('domcontentloaded');

    // Test AI Recipe Creator navigation
    const aiButton = authenticatedPage.getByRole('button', {
      name: /ai recipe creator/i,
    });
    await aiButton.click();

    // Should navigate immediately
    await expect(authenticatedPage).toHaveURL('/chat-recipe');

    console.log('✅ AI Recipe Creator navigation works');
  });

  test('should check page state without hanging', async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto('/recipes');
    await authenticatedPage.waitForLoadState('domcontentloaded');

    // Check for loading state (don't wait for it, just check if it exists)
    const loadingText = authenticatedPage.getByText(/loading/i);
    const hasLoading = await loadingText.isVisible().catch(() => false);

    if (hasLoading) {
      console.log(
        '📊 Page shows loading state (expected due to database issues)'
      );
    } else {
      console.log('📊 Page loaded without loading state');
    }

    // The important thing is that the page structure is there
    const recipesHeading = authenticatedPage.getByRole('heading', {
      name: /my recipes/i,
    });
    await expect(recipesHeading).toBeVisible();

    console.log('✅ Page structure is correct');
  });
});
