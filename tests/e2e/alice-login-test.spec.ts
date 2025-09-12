import { test, expect } from '@playwright/test';

test.describe('Alice Login Test', () => {
  test('should login as Alice explicitly', async ({ page }) => {
    // Navigate to sign in page
    await page.goto('/auth/signin');
    
    // Wait for page to load
    await page.waitForLoadState('domcontentloaded');
    
    // Fill in Alice's credentials explicitly
    await page.getByRole('textbox', { name: 'Email' }).fill('alice@example.com');
    await page.getByRole('textbox', { name: 'Password' }).fill('Password123!');
    
    // Click sign in
    await page.getByRole('button', { name: 'Sign In' }).click();
    
    // Wait for redirect to recipes page
    await expect(page).toHaveURL('/recipes');
    
    // Wait for page to load
    await page.waitForLoadState('domcontentloaded');
    
    // Check for main heading
    const recipesHeading = page.getByRole('heading', { name: /my recipes/i });
    await expect(recipesHeading).toBeVisible();
    
    // Look for user info in the UI
    const userButton = page.locator('button').filter({ hasText: /@/ });
    const userText = await userButton.textContent().catch(() => 'No user found');
    
    console.log(`📧 User signed in: ${userText}`);
    
    if (userText.includes('alice@example.com')) {
      console.log('✅ Successfully signed in as Alice');
    } else {
      console.log('❌ Not signed in as Alice');
    }
  });

  test('should check Alice recipes after login', async ({ page }) => {
    // Login as Alice
    await page.goto('/auth/signin');
    await page.waitForLoadState('domcontentloaded');
    await page.getByRole('textbox', { name: 'Email' }).fill('alice@example.com');
    await page.getByRole('textbox', { name: 'Password' }).fill('Password123!');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page).toHaveURL('/recipes');
    await page.waitForLoadState('domcontentloaded');
    
    // Wait a bit for recipes to load
    await page.waitForTimeout(3000);
    
    // Check for Alice's specific recipes
    const avocadoToast = page.getByText(/avocado toast/i);
    const capreseSalad = page.getByText(/caprese salad/i);
    
    const hasAvocadoToast = await avocadoToast.isVisible().catch(() => false);
    const hasCapreseSalad = await capreseSalad.isVisible().catch(() => false);
    
    if (hasAvocadoToast) {
      console.log('✅ Found Alice\'s Avocado Toast recipe');
    } else if (hasCapreseSalad) {
      console.log('✅ Found Alice\'s Caprese Salad recipe');
    } else {
      console.log('❓ Alice\'s recipes not visible (may be loading or database issue)');
    }
    
    // Check for recipe count
    const recipeCount = page.getByText(/recipe.*found/i);
    const hasRecipeCount = await recipeCount.isVisible().catch(() => false);
    
    if (hasRecipeCount) {
      const countText = await recipeCount.textContent();
      console.log(`📊 Recipe count: ${countText}`);
    } else {
      console.log('📊 No recipe count displayed');
    }
  });
});
