import { test, expect } from '@playwright/test';

test.describe('Clean Versioning API Test', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('verify clean versioning system works correctly', async ({ page }) => {
    console.log('🧪 Testing clean versioning system...');
    
    // Step 1: Login as Alice
    console.log('🔐 Step 1: Login as Alice Baker');
    const signInButton = page.getByRole('button', { name: 'Sign In' });
    
    if (await signInButton.isVisible()) {
      await signInButton.click();
      await page.getByRole('textbox', { name: /email/i }).fill('alice@example.com');
      await page.getByRole('textbox', { name: /password/i }).fill('Password123!');
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
    
    // Step 3: Verify only ONE Zucchini Noodles recipe shows up
    console.log('🔍 Step 3: Verifying single recipe display');
    const zucchiniHeadings = page.getByRole('heading', { name: 'Zucchini Noodles with Pesto', level: 3, exact: true });
    const zucchiniCount = await zucchiniHeadings.count();
    
    console.log(`📊 Found ${zucchiniCount} "Zucchini Noodles with Pesto" entries`);
    expect(zucchiniCount).toBe(1); // Should be exactly 1, not 3!
    
    if (zucchiniCount === 1) {
      console.log('🎉 SUCCESS: Only one recipe entry (duplicates eliminated!)');
    } else {
      console.log('❌ FAILURE: Still showing duplicate recipes');
    }
    
    // Step 4: Navigate to the recipe and test version navigation
    console.log('🔍 Step 4: Testing version navigation');
    const recipeCard = page.locator('div').filter({ hasText: 'Zucchini Noodles with Pesto' }).first();
    const menuButton = recipeCard.locator('label[aria-label="Recipe actions"]').first();
    
    await menuButton.click();
    await page.waitForTimeout(1000);
    
    const viewButton = page.getByRole('button', { name: 'View' });
    await viewButton.click();
    await page.waitForLoadState('networkidle');
    console.log('✅ Navigated to recipe view page');
    
    // Step 5: Test version selector
    console.log('📋 Step 5: Testing version selector');
    const versionMenuButton = page.getByRole('button').filter({ hasText: '⋮' });
    
    if (await versionMenuButton.isVisible()) {
      await versionMenuButton.click();
      await page.waitForTimeout(1000);
      
      // Check if version modal opened
      const versionModal = page.getByText('Recipe Versions');
      if (await versionModal.isVisible()) {
        console.log('✅ Version selector opened');
        
        // Count version entries (should be 3: v3, v2, v1)
        const versionCards = page.locator('div').filter({ hasText: /v\d+/ });
        const versionCount = await versionCards.count();
        console.log(`📊 Found ${versionCount} version entries`);
        
        // Look for specific versions
        const v1 = page.getByText('v1');
        const v2 = page.getByText('v2'); 
        const v3 = page.getByText('v3');
        
        const v1Visible = await v1.isVisible();
        const v2Visible = await v2.isVisible();
        const v3Visible = await v3.isVisible();
        
        console.log(`📋 Version 1 visible: ${v1Visible}`);
        console.log(`📋 Version 2 visible: ${v2Visible}`);
        console.log(`📋 Version 3 visible: ${v3Visible}`);
        
        if (v1Visible && v2Visible && v3Visible) {
          console.log('🎉 SUCCESS: All versions are visible!');
        }
        
        // Test switching to version 3 (should have setup data)
        const v3ViewButton = page.getByRole('button', { name: 'View' }).first();
        if (await v3ViewButton.isVisible()) {
          console.log('🔄 Switching to version 3...');
          await v3ViewButton.click();
          await page.waitForLoadState('networkidle');
          
          // Check if setup section appears
          await page.waitForTimeout(2000);
          const setupSection = page.getByText('Setup & Preparation');
          const setupVisible = await setupSection.isVisible();
          console.log(`📋 Setup section visible in version 3: ${setupVisible}`);
          
          if (setupVisible) {
            console.log('🎉 SUCCESS: Setup field is displaying correctly!');
            
            // Check for specific setup steps
            const boilWater = page.getByText('Boil Water');
            const preheatOven = page.getByText('Preheat oven to 350°F');
            
            const step1Visible = await boilWater.isVisible();
            const step2Visible = await preheatOven.isVisible();
            
            console.log(`📝 Setup step 1 visible: ${step1Visible}`);
            console.log(`📝 Setup step 2 visible: ${step2Visible}`);
          }
        }
      }
    }
    
    // Take final screenshot
    await page.screenshot({ path: 'clean-versioning-test-complete.png', fullPage: true });
    console.log('📸 Clean versioning test completed');
  });
});
