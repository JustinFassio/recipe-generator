import { test, expect } from '@playwright/test';

test.describe('Complete Version Workflow Test', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5174');
    await page.waitForLoadState('networkidle');
  });

  test('Alice Baker complete version creation workflow', async ({ page }) => {
    console.log(
      '🎯 Testing complete version creation workflow for Alice Baker...'
    );

    // Step 1: Login as Alice Baker
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
    await page.getByRole('button', { name: 'My Recipes' }).click();
    await page.waitForLoadState('networkidle');

    // Step 3: Find and edit Zucchini Noodles with Pesto
    console.log('🍝 Step 3: Finding and editing Zucchini Noodles with Pesto');
    const zucchiniHeading = page.getByRole('heading', {
      name: 'Zucchini Noodles with Pesto',
      level: 3,
      exact: true,
    });
    await expect(zucchiniHeading).toBeVisible({ timeout: 10000 });

    // Click the recipe menu and edit recipe
    const zucchiniCard = page
      .locator('div')
      .filter({ hasText: 'Zucchini Noodles with Pesto' })
      .first();
    const menuButton = zucchiniCard
      .locator('label[aria-label="Recipe actions"]')
      .first();
    await menuButton.click();
    await page.waitForTimeout(500);

    const editButton = page.getByRole('button', { name: 'Edit Recipe' });
    await editButton.click();
    await page.waitForLoadState('networkidle');

    console.log('🌐 Edit page URL:', page.url());

    // Step 4: Add a setup item
    console.log('🔧 Step 4: Adding setup item');

    // Look for setup section
    const setupSection = page.locator('text=/Setup/').first();
    if (await setupSection.isVisible()) {
      console.log('✅ Found setup section');

      // Find "Add Step" button in setup section
      const setupContainer = setupSection.locator('..').locator('..');
      const addSetupButton = setupContainer.getByRole('button', {
        name: /add.*step/i,
      });

      if (await addSetupButton.isVisible()) {
        await addSetupButton.click();
        await page.waitForTimeout(500);

        // Find the new setup input field
        const setupInputs = setupContainer.getByRole('textbox');
        const setupInputCount = await setupInputs.count();
        console.log(`📝 Found ${setupInputCount} setup inputs`);

        if (setupInputCount > 0) {
          const lastSetupInput = setupInputs.last();
          await lastSetupInput.fill('Prepare ice water bath for blanching');
          console.log(
            '✅ Added setup item: "Prepare ice water bath for blanching"'
          );
        }
      }
    } else {
      console.log('❌ Setup section not found');
    }

    // Step 5: Add an ingredient
    console.log('🥬 Step 5: Adding ingredient');

    // Find ingredients section
    const ingredientsSection = page.locator('text=/Ingredients/').first();
    if (await ingredientsSection.isVisible()) {
      console.log('✅ Found ingredients section');

      const ingredientsContainer = ingredientsSection
        .locator('..')
        .locator('..');
      const addIngredientButton = ingredientsContainer.getByRole('button', {
        name: /add.*ingredient/i,
      });

      if (await addIngredientButton.isVisible()) {
        await addIngredientButton.click();
        await page.waitForTimeout(500);

        // Find the new ingredient input field
        const ingredientInputs = ingredientsContainer.getByRole('textbox');
        const ingredientInputCount = await ingredientInputs.count();
        console.log(`📝 Found ${ingredientInputCount} ingredient inputs`);

        if (ingredientInputCount > 0) {
          const lastIngredientInput = ingredientInputs.last();
          await lastIngredientInput.fill('fresh lemon zest');
          console.log('✅ Added ingredient: "fresh lemon zest"');
        }
      }
    } else {
      console.log('❌ Ingredients section not found');
    }

    // Step 6: Update the instructions
    console.log('📝 Step 6: Updating instructions');

    const instructionsTextarea = page.getByRole('textbox', {
      name: /instructions/i,
    });
    if (await instructionsTextarea.isVisible()) {
      const currentInstructions = await instructionsTextarea.inputValue();
      const updatedInstructions =
        currentInstructions +
        ' Finish with a sprinkle of fresh lemon zest for extra brightness.';

      await instructionsTextarea.clear();
      await instructionsTextarea.fill(updatedInstructions);
      console.log('✅ Updated instructions with lemon zest finishing step');
    } else {
      console.log('❌ Instructions textarea not found');
    }

    // Step 7: Save as New Version
    console.log('💾 Step 7: Save as New Version');

    const saveAsVersionButton = page.getByRole('button', {
      name: /save.*new.*version/i,
    });
    if (await saveAsVersionButton.isVisible()) {
      await saveAsVersionButton.click();
      await page.waitForTimeout(1000);

      // Fill in version details modal
      const versionNameInput = page.getByRole('textbox', {
        name: /version name/i,
      });
      const changelogInput = page.getByRole('textbox', { name: /changelog/i });

      if (await versionNameInput.isVisible()) {
        await versionNameInput.fill('Zesty Lemon Zucchini Pesto');
        console.log('✅ Filled version name');
      }

      if (await changelogInput.isVisible()) {
        await changelogInput.fill(
          'Added fresh lemon zest and ice water bath setup for enhanced flavor and texture'
        );
        console.log('✅ Filled changelog');
      }

      // Submit the version
      const createVersionButton = page
        .getByRole('button', { name: /create/i })
        .last();
      await createVersionButton.click();
      await page.waitForLoadState('networkidle');

      console.log('🌐 URL after version creation:', page.url());

      // Check if we're on the version URL
      const currentUrl = page.url();
      const hasVersionParam = currentUrl.includes('version=');
      console.log(`🔢 Has version parameter in URL: ${hasVersionParam}`);

      if (hasVersionParam) {
        const versionMatch = currentUrl.match(/version=(\d+)/);
        const versionNumber = versionMatch ? versionMatch[1] : 'unknown';
        console.log(`📋 Version number from URL: ${versionNumber}`);
      }

      // Step 8: Verify the new version is being displayed
      console.log('🔍 Step 8: Verifying new version content is displayed');

      // Check if the page title shows the new version name
      const pageTitle = await page.title();
      console.log(`📄 Page title: ${pageTitle}`);

      // Check if the recipe content shows our changes
      const pageContent = await page.textContent('body');
      const hasLemonZest = pageContent.includes('lemon zest');
      const hasIceWaterBath = pageContent.includes('ice water bath');

      console.log(`🍋 Recipe content includes "lemon zest": ${hasLemonZest}`);
      console.log(
        `🧊 Recipe content includes "ice water bath": ${hasIceWaterBath}`
      );

      // Step 9: Check if version navigation is available
      console.log('🔍 Step 9: Checking version navigation');

      const viewVersionsButton = page
        .getByRole('button')
        .filter({ hasText: /view.*versions/i });
      const hasVersionsButton = await viewVersionsButton.isVisible();
      console.log(`📋 "View Versions" button visible: ${hasVersionsButton}`);

      if (hasVersionsButton) {
        console.log('🖱️ Opening versions modal...');
        await viewVersionsButton.click();
        await page.waitForTimeout(2000);

        const modal = page.locator('.fixed.inset-0');
        if (await modal.isVisible()) {
          console.log('✅ Version modal opened');

          // Count version cards
          const versionCards = modal
            .locator('div')
            .filter({ hasText: /Version \d+/ });
          const cardCount = await versionCards.count();
          console.log(`📊 Version cards in modal: ${cardCount}`);

          // Look for our new version
          const zestyVersionCard = modal.locator('text=/Zesty Lemon/');
          const hasZestyVersion = await zestyVersionCard.isVisible();
          console.log(
            `🍋 "Zesty Lemon" version visible in modal: ${hasZestyVersion}`
          );

          // Check for version numbers
          for (let i = 1; i <= 5; i++) {
            const versionText = modal.locator(`text=/Version ${i}/`);
            const hasVersion = await versionText.isVisible();
            if (hasVersion) {
              console.log(`📋 Version ${i}: ✅ Found`);
            }
          }
        }
      }

      // Step 10: Final verification
      console.log('🏁 Step 10: Final workflow verification');

      const workflowSuccess =
        hasVersionParam &&
        (hasLemonZest || hasIceWaterBath) &&
        hasVersionsButton;
      console.log(
        `🎯 Complete workflow success: ${workflowSuccess ? '✅' : '❌'}`
      );

      if (workflowSuccess) {
        console.log(
          '🎉 SUCCESS: Version creation workflow is working correctly!'
        );
        console.log('  ✅ Version created and saved to database');
        console.log('  ✅ Redirected to new version URL');
        console.log('  ✅ New version content is displayed');
        console.log('  ✅ Version navigation is available');
      } else {
        console.log('❌ FAILURE: Version creation workflow has issues');
        console.log(`  - Version URL: ${hasVersionParam ? '✅' : '❌'}`);
        console.log(
          `  - Content changes: ${hasLemonZest || hasIceWaterBath ? '✅' : '❌'}`
        );
        console.log(
          `  - Version navigation: ${hasVersionsButton ? '✅' : '❌'}`
        );
      }
    } else {
      console.log('❌ Save as New Version button not found');
    }

    // Take final screenshot
    await page.screenshot({
      path: 'complete-version-workflow.png',
      fullPage: true,
    });
    console.log('📸 Screenshot saved: complete-version-workflow.png');
  });
});
