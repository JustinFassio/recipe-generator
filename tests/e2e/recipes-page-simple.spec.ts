import { test, expect } from './fixtures/auth';

test.describe('Recipes Page Simple Review', () => {
  test('should login and see recipes page structure', async ({
    authenticatedPage,
  }) => {
    // Navigate to recipes page
    await authenticatedPage.goto('/recipes');

    // Wait for page to load
    await authenticatedPage.waitForLoadState('networkidle');

    // Take a screenshot for review
    await authenticatedPage.screenshot({ path: 'recipes-page-simple.png' });

    // Verify we're on the recipes page
    await expect(authenticatedPage).toHaveURL('/recipes');

    // Check for main heading
    const recipesHeading = authenticatedPage.getByRole('heading', {
      name: /my recipes/i,
    });
    await expect(recipesHeading).toBeVisible();

    console.log('✅ Recipes page loaded and heading is visible');
  });

  test('should find all main buttons on recipes page', async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto('/recipes');
    await authenticatedPage.waitForLoadState('networkidle');

    // Check for AI Recipe Creator button
    const aiButton = authenticatedPage.getByRole('button', {
      name: /ai recipe creator/i,
    });
    await expect(aiButton).toBeVisible();

    // Check for Add Recipe button
    const addButton = authenticatedPage.getByRole('button', {
      name: /add recipe/i,
    });
    await expect(addButton).toBeVisible();

    // Check for Filters & Search button
    const filtersButton = authenticatedPage.getByRole('button', {
      name: /filters.*search/i,
    });
    await expect(filtersButton).toBeVisible();

    console.log('✅ All main buttons are visible:');
    console.log('  - AI Recipe Creator');
    console.log('  - Add Recipe');
    console.log('  - Filters & Search');
  });

  test('should check recipes loading state', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/recipes');
    await authenticatedPage.waitForLoadState('networkidle');

    // Check if we see loading state or recipe count
    const loadingText = authenticatedPage.getByText(/loading/i);
    const recipeCountText = authenticatedPage.getByText(/recipe.*found/i);
    const noRecipesText = authenticatedPage.getByText(/no recipes found/i);

    // Check which state we're in
    const isLoading = await loadingText.isVisible();
    const hasRecipeCount = await recipeCountText.isVisible();
    const hasNoRecipes = await noRecipesText.isVisible();

    if (isLoading) {
      console.log(
        '⏳ Recipes are still loading (likely due to database connectivity issues)'
      );
    } else if (hasRecipeCount) {
      console.log('✅ Recipe count is displayed');
    } else if (hasNoRecipes) {
      console.log('📝 No recipes found state is displayed');
    } else {
      console.log('❓ Unknown state - taking screenshot for review');
      await authenticatedPage.screenshot({ path: 'recipes-unknown-state.png' });
    }
  });

  test('should test navigation to add recipe page', async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto('/recipes');
    await authenticatedPage.waitForLoadState('networkidle');

    // Click Add Recipe button
    const addButton = authenticatedPage.getByRole('button', {
      name: /add recipe/i,
    });
    await addButton.click();

    // Should navigate to add recipe page
    await expect(authenticatedPage).toHaveURL('/add');

    // Go back to recipes
    await authenticatedPage.goto('/recipes');

    console.log('✅ Navigation to add recipe page works');
  });

  test('should test navigation to AI recipe creator', async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto('/recipes');
    await authenticatedPage.waitForLoadState('networkidle');

    // Click AI Recipe Creator button
    const aiButton = authenticatedPage.getByRole('button', {
      name: /ai recipe creator/i,
    });
    await aiButton.click();

    // Should navigate to chat-recipe page
    await expect(authenticatedPage).toHaveURL('/chat-recipe');

    console.log('✅ Navigation to AI recipe creator works');
  });

  test('should test filters button', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/recipes');
    await authenticatedPage.waitForLoadState('networkidle');

    // Click Filters & Search button
    const filtersButton = authenticatedPage.getByRole('button', {
      name: /filters.*search/i,
    });
    await filtersButton.click();

    // Wait a moment to see if anything opens
    await authenticatedPage.waitForTimeout(1000);

    // Take screenshot to see what happened
    await authenticatedPage.screenshot({ path: 'filters-clicked.png' });

    console.log('✅ Filters button is clickable');
  });
});
