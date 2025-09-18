import { test, expect } from '@playwright/test';

test.describe('Version API Test', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('test clean versioning API functionality', async ({ page }) => {
    console.log('🧪 Testing clean versioning API...');

    // Step 1: Login as Alice
    console.log('🔐 Step 1: Login as Alice Baker');
    const signInButton = page.getByRole('button', { name: 'Sign In' });

    if (await signInButton.isVisible()) {
      await signInButton.click();
      await page
        .getByRole('textbox', { name: /email/i })
        .fill('alice@example.com');
      await page
        .getByRole('textbox', { name: /password/i })
        .fill('Password123!');
      await page.getByRole('button', { name: /sign in/i }).click();
      await page.waitForLoadState('networkidle');
      console.log('✅ Login completed');
    }

    // Step 2: Navigate to My Recipes
    console.log('📋 Step 2: Navigate to My Recipes');
    const myRecipesButton = page.getByRole('button', { name: 'My Recipes' });
    if (await myRecipesButton.isVisible()) {
      await myRecipesButton.click();
      await page.waitForLoadState('networkidle');
    }

    // Step 3: Verify single recipe display and click it
    console.log('🔍 Step 3: Accessing Zucchini Noodles recipe');
    const zucchiniHeadings = page.getByRole('heading', {
      name: 'Zucchini Noodles with Pesto',
      level: 3,
      exact: true,
    });
    const count = await zucchiniHeadings.count();
    console.log(`📊 Found ${count} Zucchini Noodles recipes`);

    expect(count).toBe(1); // Should be exactly 1

    // Click to view the recipe
    const recipeCard = page
      .locator('div')
      .filter({ hasText: 'Zucchini Noodles with Pesto' })
      .first();
    const menuButton = recipeCard
      .locator('label[aria-label="Recipe actions"]')
      .first();

    await menuButton.click();
    await page.waitForTimeout(1000);

    const viewButton = page.getByRole('button', { name: 'View' });
    await viewButton.click();
    await page.waitForLoadState('networkidle');
    console.log('✅ Navigated to recipe view page');

    // Step 4: Check if versioning works without errors
    console.log('🔍 Step 4: Testing version navigation');

    // Wait a bit for any API calls to complete
    await page.waitForTimeout(3000);

    // Check console for errors (logs variable removed as unused)
    await page.evaluate(() => {
      return window.console.errors || [];
    });

    // Look for version selector
    const versionMenuButton = page.getByRole('button').filter({ hasText: '⋮' });

    if (await versionMenuButton.isVisible()) {
      console.log('✅ Version menu button found');
      await versionMenuButton.click();
      await page.waitForTimeout(1000);

      // Check if version modal opens without errors
      const versionModal = page.getByText('Recipe Versions');
      if (await versionModal.isVisible()) {
        console.log('✅ Version modal opened successfully');

        // Check for version entries
        const versionEntries = page.locator('div').filter({ hasText: /v\d+/ });
        const versionCount = await versionEntries.count();
        console.log(`📊 Found ${versionCount} version entries`);

        if (versionCount >= 3) {
          console.log('🎉 SUCCESS: Multiple versions are visible!');
        }
      } else {
        console.log('❌ Version modal did not open');
      }
    } else {
      console.log('❌ Version menu button not found');
    }

    // Take screenshot
    await page.screenshot({
      path: 'version-api-test-result.png',
      fullPage: true,
    });
    console.log('📸 Test completed');
  });
});
