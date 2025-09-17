import { test } from '@playwright/test';

test.describe('Comprehensive Versioning Investigation', () => {
  test('create test data and investigate versioning issues', async ({
    page,
  }) => {
    console.log('🚨 Starting comprehensive versioning investigation...');

    // Navigate to the app and sign in
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Sign in or create account
    const signInButton = page.locator('button', { hasText: 'Sign In' });
    if ((await signInButton.count()) > 0) {
      console.log('🔐 Attempting to sign in...');
      await signInButton.click();

      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      await page.waitForLoadState('networkidle');

      // Check if sign in failed
      const errorMessage = page.locator('text=/error|invalid|failed/i');
      if ((await errorMessage.count()) > 0) {
        console.log('❌ Sign in failed, trying to create account...');

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

    console.log(
      '\n📝 STEP 1: Creating unshared recipe (Personal Workout Smoothie)'
    );

    // Navigate to create recipe
    const createButton = page.locator('button', { hasText: 'Create Recipe' });
    if ((await createButton.count()) === 0) {
      await page.goto('/create');
    } else {
      await createButton.click();
    }

    await page.waitForLoadState('networkidle');

    // Create unshared recipe
    await page.fill('input[name="title"]', 'Personal Workout Smoothie');
    await page.fill('input[name="ingredients.0"]', '1 banana');

    // Add more ingredients
    const addIngredientButton = page.locator('button', {
      hasText: 'Add Ingredient',
    });
    if ((await addIngredientButton.count()) > 0) {
      await addIngredientButton.click();
      await page.fill('input[name="ingredients.1"]', '1 cup protein powder');
      await addIngredientButton.click();
      await page.fill('input[name="ingredients.2"]', '1 cup almond milk');
    }

    await page.fill(
      'textarea[name="instructions"]',
      'Blend all ingredients until smooth. Serve immediately.'
    );

    // Save recipe (keep it private)
    const saveButton = page.locator('button[type="submit"]');
    await saveButton.click();
    await page.waitForLoadState('networkidle');

    console.log('✅ Created unshared recipe');

    console.log('\n📝 STEP 2: Creating shared recipe (Avocado Toast)');

    // Navigate to create another recipe
    await page.goto('/create');
    await page.waitForLoadState('networkidle');

    // Create recipe that will be shared
    await page.fill('input[name="title"]', 'Avocado Toast');
    await page.fill('input[name="ingredients.0"]', '2 slices bread');

    if ((await addIngredientButton.count()) > 0) {
      await addIngredientButton.click();
      await page.fill('input[name="ingredients.1"]', '1 avocado');
      await addIngredientButton.click();
      await page.fill('input[name="ingredients.2"]', 'Salt and pepper');
    }

    await page.fill(
      'textarea[name="instructions"]',
      'Toast bread, mash avocado, spread on toast, season.'
    );

    // Save recipe
    await saveButton.click();
    await page.waitForLoadState('networkidle');

    console.log('✅ Created recipe that will be shared');

    // Navigate back to home to find the recipe
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Find and click on Avocado Toast recipe
    const avocadoToastCard = page
      .locator('[data-testid="recipe-card"]')
      .filter({ hasText: 'Avocado Toast' })
      .first();

    if ((await avocadoToastCard.count()) > 0) {
      await avocadoToastCard.click();
      await page.waitForLoadState('networkidle');

      // Share the recipe
      const shareButton = page.locator('button', { hasText: 'Share' });
      const makePublicButton = page.locator('button', {
        hasText: 'Make Public',
      });

      if ((await shareButton.count()) > 0) {
        console.log('📢 Sharing recipe...');
        await shareButton.click();
        await page.waitForLoadState('networkidle');
      } else if ((await makePublicButton.count()) > 0) {
        await makePublicButton.click();
        await page.waitForLoadState('networkidle');
      }

      console.log('✅ Recipe shared');
    }

    console.log(
      '\n🔍 ISSUE 2 TEST: Testing version creation on UNSHARED recipe'
    );

    // Navigate back to home and test unshared recipe
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const smoothieCard = page
      .locator('[data-testid="recipe-card"]')
      .filter({ hasText: 'Personal Workout Smoothie' })
      .first();

    if ((await smoothieCard.count()) > 0) {
      console.log('✅ Found unshared Personal Workout Smoothie recipe');
      await smoothieCard.click();
      await page.waitForLoadState('networkidle');

      // Check if Create New Version button exists on unshared recipe
      const createVersionButton = page.locator('button', {
        hasText: 'Create New Version',
      });
      console.log(
        `🔍 Create New Version buttons on UNSHARED recipe: ${await createVersionButton.count()}`
      );

      if ((await createVersionButton.count()) === 0) {
        console.log(
          '🚨 ISSUE 2 CONFIRMED: Cannot create version on unshared recipe'
        );

        // Check what buttons ARE available
        const allButtons = await page.locator('button').all();
        console.log('📋 Available buttons on unshared recipe:');
        for (let i = 0; i < Math.min(allButtons.length, 10); i++) {
          const buttonText = await allButtons[i].textContent();
          if (buttonText && buttonText.trim()) {
            console.log(`  - "${buttonText.trim()}"`);
          }
        }
      } else {
        console.log('✅ Create New Version button found on unshared recipe');
      }
    } else {
      console.log('❌ Personal Workout Smoothie not found');
    }

    console.log(
      '\n🔍 ISSUE 1 TEST: Testing version visibility on SHARED recipe'
    );

    // Navigate back to home and test shared recipe
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const avocadoCard = page
      .locator('[data-testid="recipe-card"]')
      .filter({ hasText: 'Avocado Toast' })
      .first();

    if ((await avocadoCard.count()) > 0) {
      console.log('✅ Found shared Avocado Toast recipe');
      await avocadoCard.click();
      await page.waitForLoadState('networkidle');

      // Check current version
      const versionBadge = page.locator('text=/Version \\d+/');
      if ((await versionBadge.count()) > 0) {
        const currentVersion = await versionBadge.textContent();
        console.log(`📍 Currently viewing: ${currentVersion}`);
      } else {
        console.log('⚠️ No version badge found');
      }

      // Test Create New Version functionality
      const createVersionButton = page.locator('button', {
        hasText: 'Create New Version',
      });
      console.log(
        `🔍 Create New Version buttons on SHARED recipe: ${await createVersionButton.count()}`
      );

      if ((await createVersionButton.count()) > 0) {
        console.log('🔄 Creating new version...');
        await createVersionButton.click();
        await page.waitForTimeout(1000);

        // Fill version creation form
        const versionNameInput = page.locator(
          'input[placeholder*="version name"]'
        );
        const changelogInput = page.locator(
          'textarea[placeholder*="What Changed"]'
        );

        if ((await versionNameInput.count()) > 0) {
          await versionNameInput.fill('Cilantro Version');
        }
        if ((await changelogInput.count()) > 0) {
          await changelogInput.fill(
            'Added toast bread as setup step and cilantro as ingredient'
          );
        }

        const createButton = page.locator('button', {
          hasText: 'Create Version',
        });
        if ((await createButton.count()) > 0) {
          await createButton.click();
          await page.waitForLoadState('networkidle');
          console.log('✅ Created new version');

          // Check if we're now viewing the new version
          const newVersionBadge = page.locator('text=/Version \\d+/');
          if ((await newVersionBadge.count()) > 0) {
            const newVersion = await newVersionBadge.textContent();
            console.log(`📍 Now viewing: ${newVersion}`);
          }
        }
      } else {
        console.log('❌ No Create New Version button on shared recipe');
      }

      // Now test version visibility (the critical issue)
      console.log('\n🔍 Testing version selector visibility...');

      // Look for version selector
      const threeDots = page.locator('button').filter({ hasText: '⋮' });
      const moreButton = page.locator('button').filter({ hasText: 'More' });
      const versionButton = page
        .locator('button')
        .filter({ hasText: 'Version' });

      console.log(`Three dots buttons: ${await threeDots.count()}`);
      console.log(`More buttons: ${await moreButton.count()}`);
      console.log(`Version buttons: ${await versionButton.count()}`);

      let versionMenuOpened = false;

      if ((await threeDots.count()) > 0) {
        console.log('🔄 Opening version selector...');
        await threeDots.first().click();
        versionMenuOpened = true;
      } else if ((await moreButton.count()) > 0) {
        await moreButton.first().click();
        versionMenuOpened = true;
      } else if ((await versionButton.count()) > 0) {
        await versionButton.first().click();
        versionMenuOpened = true;
      }

      if (versionMenuOpened) {
        await page.waitForTimeout(2000);

        // Check if version modal opened
        const versionModal = page.locator('text="Recipe Versions"');
        const modalTitle = page.locator('h2', { hasText: 'Recipe Versions' });

        if (
          (await versionModal.count()) > 0 ||
          (await modalTitle.count()) > 0
        ) {
          console.log('✅ Version selector modal opened');

          // Count versions shown - this is the critical test
          const versionCards = page.locator('[data-testid="version-card"]');
          const versionCount = await versionCards.count();
          console.log(`📊 Version cards found: ${versionCount}`);

          if (versionCount === 0) {
            // Try alternative selectors
            const versionDivs = page
              .locator('div')
              .filter({ hasText: /v\d+/i });
            const versionItems = page.locator('[class*="version"]');

            console.log(
              `Alternative version divs: ${await versionDivs.count()}`
            );
            console.log(`Version items: ${await versionItems.count()}`);
          }

          // Count View and Current buttons
          const viewButtons = page.locator('button', { hasText: 'View' });
          const currentButtons = page.locator('button', { hasText: 'Current' });

          console.log(`🔘 View buttons: ${await viewButtons.count()}`);
          console.log(`🔘 Current buttons: ${await currentButtons.count()}`);

          // CRITICAL TEST: Can we see multiple versions?
          const totalVersionButtons =
            (await viewButtons.count()) + (await currentButtons.count());
          console.log(
            `🔢 Total version interaction buttons: ${totalVersionButtons}`
          );

          if (totalVersionButtons < 2) {
            console.log(
              '🚨 ISSUE 1 CONFIRMED: Only seeing one version, missing other versions!'
            );

            // Log modal content for debugging
            const modalContent = await page
              .locator('.modal, [role="dialog"], [data-testid*="modal"]')
              .first()
              .textContent();
            console.log(
              '📄 Modal content preview:',
              modalContent?.substring(0, 300) + '...'
            );
          } else {
            console.log('✅ Multiple versions visible');

            // Test version switching
            if ((await viewButtons.count()) > 0) {
              console.log('🔄 Testing version switching...');
              await viewButtons.first().click();
              await page.waitForLoadState('networkidle');

              const switchedVersionBadge = page.locator('text=/Version \\d+/');
              if ((await switchedVersionBadge.count()) > 0) {
                const switchedVersion =
                  await switchedVersionBadge.textContent();
                console.log(`📍 Switched to: ${switchedVersion}`);
              }
            }
          }
        } else {
          console.log('❌ Version selector modal did not open');
        }
      } else {
        console.log('❌ No version selector found');
      }
    } else {
      console.log('❌ Avocado Toast recipe not found');
    }

    // Take comprehensive screenshots
    await page.screenshot({
      path: 'versioning-comprehensive-debug.png',
      fullPage: true,
    });

    console.log('\n📋 INVESTIGATION SUMMARY:');
    console.log('- Created test recipes (shared and unshared)');
    console.log('- Tested version creation restrictions');
    console.log('- Tested version visibility in selector');
    console.log('- Screenshots saved for analysis');
    console.log('📸 Screenshot: versioning-comprehensive-debug.png');
  });
});
