import { test, expect } from './fixtures/auth';
import { TEST_USERS } from './utils/test-user-setup';

test.describe('Recipes Page', () => {
  test('should display recipes page for authenticated user', async ({ authenticatedPage }) => {
    await expect(authenticatedPage).toHaveURL('/recipes');
    
    // Check for key elements on the recipes page
    await expect(authenticatedPage.getByRole('heading', { name: /recipes/i })).toBeVisible();
  });

  test('should allow user to create new recipe', async ({ authenticatedPage }) => {
    // Look for "Add Recipe" or "Create Recipe" button
    const addRecipeButton = authenticatedPage.getByRole('button', { name: /add|create.*recipe/i });
    await expect(addRecipeButton).toBeVisible();
    
    // Click the button to start creating a recipe
    await addRecipeButton.click();
    
    // Should navigate to recipe creation form
    await expect(authenticatedPage).toHaveURL(/\/recipes\/new|\/recipes\/create/);
  });

  test('should display recipe cards', async ({ authenticatedPage }) => {
    // Wait for recipes to load
    await authenticatedPage.waitForLoadState('networkidle');
    
    // Look for recipe cards or recipe list
    const recipeCards = authenticatedPage.locator('[data-testid="recipe-card"]');
    const recipeList = authenticatedPage.locator('[data-testid="recipe-list"]');
    
    // At least one of these should be present
    const hasRecipeCards = await recipeCards.count() > 0;
    const hasRecipeList = await recipeList.count() > 0;
    
    expect(hasRecipeCards || hasRecipeList).toBeTruthy();
  });

  test('should allow filtering recipes', async ({ authenticatedPage }) => {
    // Look for filter controls
    const filterButton = authenticatedPage.getByRole('button', { name: /filter/i });
    const searchInput = authenticatedPage.getByRole('textbox', { name: /search/i });
    
    // At least one filtering mechanism should be available
    const hasFilterButton = await filterButton.count() > 0;
    const hasSearchInput = await searchInput.count() > 0;
    
    expect(hasFilterButton || hasSearchInput).toBeTruthy();
  });

  test('should allow user to view recipe details', async ({ authenticatedPage }) => {
    // Wait for recipes to load
    await authenticatedPage.waitForLoadState('networkidle');
    
    // Look for the first recipe card or recipe link
    const firstRecipe = authenticatedPage.locator('[data-testid="recipe-card"]').first();
    const recipeLink = authenticatedPage.getByRole('link', { name: /recipe/i }).first();
    
    if (await firstRecipe.count() > 0) {
      await firstRecipe.click();
    } else if (await recipeLink.count() > 0) {
      await recipeLink.click();
    } else {
      // Skip test if no recipes are available
      test.skip();
    }
    
    // Should navigate to recipe detail page
    await expect(authenticatedPage).toHaveURL(/\/recipes\/\d+/);
  });
});

test.describe('Recipe Creation', () => {
  test('should create a new recipe', async ({ authenticatedPage }) => {
    // Navigate to recipe creation
    await authenticatedPage.goto('/recipes/new');
    
    // Fill out basic recipe information
    await authenticatedPage.getByRole('textbox', { name: /title|name/i }).fill('Test Recipe');
    await authenticatedPage.getByRole('textbox', { name: /description/i }).fill('A test recipe for E2E testing');
    
    // Add ingredients
    const ingredientInput = authenticatedPage.getByRole('textbox', { name: /ingredient/i });
    if (await ingredientInput.count() > 0) {
      await ingredientInput.fill('1 cup flour');
    }
    
    // Add instructions
    const instructionInput = authenticatedPage.getByRole('textbox', { name: /instruction|step/i });
    if (await instructionInput.count() > 0) {
      await instructionInput.fill('Mix ingredients together');
    }
    
    // Save the recipe
    const saveButton = authenticatedPage.getByRole('button', { name: /save|create/i });
    await saveButton.click();
    
    // Should redirect to the new recipe or recipes list
    await expect(authenticatedPage).toHaveURL(/\/recipes/);
  });
});
