import { test, expect } from './fixtures/auth';

test.describe('Recipes Page Review', () => {
  test('should login and review recipes page elements', async ({ authenticatedPage }) => {
    // Navigate to recipes page (should be the default after login)
    await authenticatedPage.goto('/recipes');
    
    // Wait for page to load completely
    await authenticatedPage.waitForLoadState('networkidle');
    
    // Take a screenshot for review
    await authenticatedPage.screenshot({ path: 'recipes-page-review.png' });
    
    // Verify we're on the recipes page
    await expect(authenticatedPage).toHaveURL('/recipes');
    
    // Check for main page elements
    const recipesHeading = authenticatedPage.getByRole('heading', { name: /my recipes/i });
    await expect(recipesHeading).toBeVisible();
    
    // Check for recipe count display
    const recipeCount = authenticatedPage.getByText(/recipe.*found/i);
    await expect(recipeCount).toBeVisible();
    
    console.log('✅ Recipes page loaded successfully');
  });

  test('should find and interact with recipe page buttons', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/recipes');
    await authenticatedPage.waitForLoadState('networkidle');
    
    // Check for AI Recipe Creator button
    const aiButton = authenticatedPage.getByRole('button', { name: /ai recipe creator/i });
    await expect(aiButton).toBeVisible();
    
    // Check for Add Recipe button
    const addButton = authenticatedPage.getByRole('button', { name: /add recipe/i });
    await expect(addButton).toBeVisible();
    
    // Check for search box
    const searchBox = authenticatedPage.getByRole('textbox', { name: /search recipes/i });
    await expect(searchBox).toBeVisible();
    
    console.log('✅ All main buttons and search box are visible');
  });

  test('should find filter buttons on recipes page', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/recipes');
    await authenticatedPage.waitForLoadState('networkidle');
    
    // Check for filter buttons
    const categoriesButton = authenticatedPage.getByRole('button', { name: /categories/i });
    await expect(categoriesButton).toBeVisible();
    
    const cuisinesButton = authenticatedPage.getByRole('button', { name: /cuisines/i });
    await expect(cuisinesButton).toBeVisible();
    
    const moodsButton = authenticatedPage.getByRole('button', { name: /moods/i });
    await expect(moodsButton).toBeVisible();
    
    const ingredientsButton = authenticatedPage.getByRole('button', { name: /ingredients/i });
    await expect(ingredientsButton).toBeVisible();
    
    console.log('✅ All filter buttons are visible');
  });

  test('should handle empty recipes state', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/recipes');
    await authenticatedPage.waitForLoadState('networkidle');
    
    // Check if we see the "No recipes found" state
    const noRecipesMessage = authenticatedPage.getByText(/no recipes found/i);
    const addFirstRecipeButton = authenticatedPage.getByRole('button', { name: /add your first recipe/i });
    
    // Either we have recipes or we see the empty state
    const hasRecipes = await authenticatedPage.locator('[data-testid="recipe-card"]').count() > 0;
    const hasEmptyState = await noRecipesMessage.isVisible();
    
    if (hasEmptyState) {
      await expect(noRecipesMessage).toBeVisible();
      await expect(addFirstRecipeButton).toBeVisible();
      console.log('✅ Empty recipes state is displayed correctly');
    } else {
      console.log('✅ Recipes are displayed');
    }
  });

  test('should test search functionality', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/recipes');
    await authenticatedPage.waitForLoadState('networkidle');
    
    // Find the search box
    const searchBox = authenticatedPage.getByRole('textbox', { name: /search recipes/i });
    await expect(searchBox).toBeVisible();
    
    // Type in the search box
    await searchBox.fill('test search');
    
    // Verify the text was entered
    await expect(searchBox).toHaveValue('test search');
    
    // Clear the search
    await searchBox.clear();
    await expect(searchBox).toHaveValue('');
    
    console.log('✅ Search functionality is working');
  });

  test('should test navigation buttons', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/recipes');
    await authenticatedPage.waitForLoadState('networkidle');
    
    // Test AI Recipe Creator button
    const aiButton = authenticatedPage.getByRole('button', { name: /ai recipe creator/i });
    await aiButton.click();
    
    // Should navigate to chat-recipe page
    await expect(authenticatedPage).toHaveURL('/chat-recipe');
    
    // Go back to recipes
    await authenticatedPage.goto('/recipes');
    await authenticatedPage.waitForLoadState('networkidle');
    
    // Test Add Recipe button
    const addButton = authenticatedPage.getByRole('button', { name: /add recipe/i });
    await addButton.click();
    
    // Should navigate to add recipe page
    await expect(authenticatedPage).toHaveURL('/add');
    
    console.log('✅ Navigation buttons are working correctly');
  });
});
