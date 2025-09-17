import { test } from '@playwright/test';

test.describe('Recipe Version Investigation with Test Data', () => {
  test('create recipe versions and investigate viewing issue', async ({
    page,
  }) => {
    console.log('🔍 Starting comprehensive version investigation...');

    // Navigate to the app
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check if we need to sign in
    const signInButton = page.locator('button', { hasText: 'Sign In' });
    if ((await signInButton.count()) > 0) {
      console.log('🔐 Signing in...');
      await signInButton.click();

      // Fill in credentials
      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      await page.waitForLoadState('networkidle');

      // Check if sign in was successful
      const profileButton = page.locator('[data-testid="profile-button"]');
      if ((await profileButton.count()) === 0) {
        console.log('❌ Sign in failed - may need to create account first');

        // Try to create account
        const createAccountButton = page.locator('button', {
          hasText: 'Create Account',
        });
        if ((await createAccountButton.count()) > 0) {
          await createAccountButton.click();
          await page.fill('input[type="email"]', 'test@example.com');
          await page.fill('input[type="password"]', 'password123');
          await page.click('button[type="submit"]');
          await page.waitForLoadState('networkidle');
        }
      }
    }

    // Navigate to create recipe
    console.log('📝 Creating test recipe...');
    const createButton = page.locator('button', { hasText: 'Create Recipe' });
    if ((await createButton.count()) === 0) {
      // Try alternative ways to create recipe
      const addButton = page.locator('[data-testid="add-recipe-button"]');
      const plusButton = page.locator('button').filter({ hasText: '+' });

      if ((await addButton.count()) > 0) {
        await addButton.click();
      } else if ((await plusButton.count()) > 0) {
        await plusButton.first().click();
      } else {
        // Navigate directly to create page
        await page.goto('/create');
      }
    } else {
      await createButton.click();
    }

    await page.waitForLoadState('networkidle');

    // Fill in recipe form
    console.log('📝 Filling recipe form...');
    await page.fill('input[name="title"]', 'Test Avocado Toast');
    await page.fill('input[name="ingredients.0"]', '2 slices bread');

    // Add more ingredients
    const addIngredientButton = page.locator('button', {
      hasText: 'Add Ingredient',
    });
    if ((await addIngredientButton.count()) > 0) {
      await addIngredientButton.click();
      await page.fill('input[name="ingredients.1"]', '1 avocado');
      await addIngredientButton.click();
      await page.fill('input[name="ingredients.2"]', 'Salt and pepper');
    }

    await page.fill(
      'textarea[name="instructions"]',
      'Toast bread, mash avocado, spread on toast, season with salt and pepper.'
    );

    // Save recipe
    const saveButton = page.locator('button[type="submit"]');
    await saveButton.click();
    await page.waitForLoadState('networkidle');

    console.log('✅ Original recipe created');

    // Navigate to the recipe to make it public and create versions
    // First, find our recipe
    const testRecipe = page
      .locator('[data-testid="recipe-card"]')
      .filter({ hasText: 'Test Avocado Toast' })
      .first();
    if ((await testRecipe.count()) > 0) {
      await testRecipe.click();
      await page.waitForLoadState('networkidle');

      // Make recipe public if there's a share/publish button
      const publishButton = page.locator('button', { hasText: 'Share' });
      const makePublicButton = page.locator('button', {
        hasText: 'Make Public',
      });

      if ((await publishButton.count()) > 0) {
        console.log('📢 Making recipe public...');
        await publishButton.click();
        await page.waitForLoadState('networkidle');
      } else if ((await makePublicButton.count()) > 0) {
        await makePublicButton.click();
        await page.waitForLoadState('networkidle');
      }

      // Look for "Create New Version" button
      const createVersionButton = page.locator('button', {
        hasText: 'Create New Version',
      });
      if ((await createVersionButton.count()) > 0) {
        console.log('🔄 Creating version 2...');
        await createVersionButton.click();

        // Fill version creation modal
        await page.fill(
          'input[placeholder*="version name"]',
          'Extra Spicy Version'
        );
        await page.fill(
          'textarea[placeholder*="What Changed"]',
          'Added hot sauce and red pepper flakes'
        );

        const createButton = page.locator('button', {
          hasText: 'Create Version',
        });
        await createButton.click();
        await page.waitForLoadState('networkidle');

        console.log('✅ Version 2 created');

        // Now test version viewing
        console.log('🔍 Testing version viewing...');

        // Check current version
        const versionBadge = page.locator('text=/Version \\d+/');
        if ((await versionBadge.count()) > 0) {
          const currentVersion = await versionBadge.textContent();
          console.log(`📍 Currently viewing: ${currentVersion}`);
        }

        // Look for version selector
        const versionMenuButton = page
          .locator('button')
          .filter({ hasText: '⋮' });
        const moreOptionsButton = page.locator('[data-testid="more-options"]');

        if ((await versionMenuButton.count()) > 0) {
          console.log('✅ Found version menu button');
          await versionMenuButton.first().click();
        } else if ((await moreOptionsButton.count()) > 0) {
          await moreOptionsButton.click();
        } else {
          console.log('❌ No version menu button found');

          // Try to find any button that might open versions
          const allButtons = await page.locator('button').all();
          console.log(`Found ${allButtons.length} buttons on page`);

          for (let i = 0; i < Math.min(allButtons.length, 10); i++) {
            const buttonText = await allButtons[i].textContent();
            console.log(`Button ${i}: "${buttonText}"`);
          }
        }

        await page.waitForTimeout(1000);

        // Check if version modal opened
        const versionModal = page.locator('text="Recipe Versions"');
        if ((await versionModal.count()) > 0) {
          console.log('✅ Version modal opened');

          // Count versions shown
          const versionCards = page.locator('[data-testid="version-card"]');
          const versionCount = await versionCards.count();
          console.log(`📊 Versions shown: ${versionCount}`);

          if (versionCount === 0) {
            // Try alternative selectors
            const versionItems = page
              .locator('div')
              .filter({ hasText: /v\d+/ });
            const altVersionCount = await versionItems.count();
            console.log(`📊 Alternative version count: ${altVersionCount}`);
          }

          // Look for View buttons
          const viewButtons = page.locator('button', { hasText: 'View' });
          const currentButtons = page.locator('button', { hasText: 'Current' });

          console.log(`🔘 View buttons: ${await viewButtons.count()}`);
          console.log(`🔘 Current buttons: ${await currentButtons.count()}`);

          // Try to click a View button if available
          if ((await viewButtons.count()) > 0) {
            console.log('🔄 Clicking View button...');
            await viewButtons.first().click();
            await page.waitForLoadState('networkidle');

            // Check if version changed
            const newVersionBadge = page.locator('text=/Version \\d+/');
            if ((await newVersionBadge.count()) > 0) {
              const newVersion = await newVersionBadge.textContent();
              console.log(`📍 Now viewing: ${newVersion}`);
            }
          } else {
            console.log('❌ No View buttons found - this is the issue!');
          }
        } else {
          console.log('❌ Version modal did not open');
        }
      } else {
        console.log('❌ No "Create New Version" button found');
      }
    } else {
      console.log('❌ Could not find test recipe');
    }

    // Take screenshot for debugging
    await page.screenshot({
      path: 'version-investigation-debug.png',
      fullPage: true,
    });
    console.log('📸 Screenshot saved');
  });
});
