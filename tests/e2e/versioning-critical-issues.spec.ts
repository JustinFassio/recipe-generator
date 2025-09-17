import { test } from '@playwright/test';

test.describe('Critical Versioning Issues Investigation', () => {
  test('investigate version viewing and creation issues', async ({ page }) => {
    console.log('🚨 Starting critical versioning issues investigation...');

    // Navigate to the app
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Sign in first (assuming we need to be authenticated)
    const signInButton = page.locator('button', { hasText: 'Sign In' });
    if ((await signInButton.count()) > 0) {
      console.log('🔐 Signing in...');
      await signInButton.click();

      await page.fill('input[type="email"]', 'test@example.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      await page.waitForLoadState('networkidle');
    }

    console.log(
      '\n🔍 ISSUE 1: Testing version visibility on shared recipe (Avocado Toast)'
    );

    // Look for Avocado Toast recipe (should be shared)
    const avocadoToastCard = page
      .locator('[data-testid="recipe-card"]')
      .filter({ hasText: 'Avocado Toast' })
      .first();

    if ((await avocadoToastCard.count()) > 0) {
      console.log('✅ Found Avocado Toast recipe');
      await avocadoToastCard.click();
      await page.waitForLoadState('networkidle');

      // Check what version we're currently viewing
      const versionBadge = page.locator('text=/Version \\d+/');
      if ((await versionBadge.count()) > 0) {
        const currentVersion = await versionBadge.textContent();
        console.log(`📍 Currently viewing: ${currentVersion}`);
      } else {
        console.log('❌ No version badge found on shared recipe');
      }

      // Look for version selector (3 dots or menu button)
      console.log('🔍 Looking for version selector...');
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
        console.log('🔄 Clicking three dots button...');
        await threeDots.first().click();
        versionMenuOpened = true;
      } else if ((await moreButton.count()) > 0) {
        console.log('🔄 Clicking more button...');
        await moreButton.first().click();
        versionMenuOpened = true;
      } else if ((await versionButton.count()) > 0) {
        console.log('🔄 Clicking version button...');
        await versionButton.first().click();
        versionMenuOpened = true;
      } else {
        console.log('❌ No version menu button found at all');
      }

      if (versionMenuOpened) {
        await page.waitForTimeout(1000);

        // Check if version modal opened
        const versionModal = page.locator('text="Recipe Versions"');
        const modalTitle = page.locator('h2', { hasText: 'Recipe Versions' });

        if (
          (await versionModal.count()) > 0 ||
          (await modalTitle.count()) > 0
        ) {
          console.log('✅ Version selector modal opened');

          // Count versions shown
          const versionCards = page.locator('[data-testid="version-card"]');
          const versionCount = await versionCards.count();
          console.log(`📊 Version cards found: ${versionCount}`);

          if (versionCount === 0) {
            // Try alternative selectors for versions
            const versionDivs = page
              .locator('div')
              .filter({ hasText: /v\d+/i });
            const versionItems = page.locator('[class*="version"]');
            const badgeElements = page.locator('.badge, [class*="badge"]');

            console.log(
              `Alternative version divs: ${await versionDivs.count()}`
            );
            console.log(`Version items: ${await versionItems.count()}`);
            console.log(`Badge elements: ${await badgeElements.count()}`);

            // Log what's actually in the modal
            const modalContent = await page
              .locator('.modal, [role="dialog"], [data-testid*="modal"]')
              .textContent();
            console.log(
              '📄 Modal content:',
              modalContent?.substring(0, 500) + '...'
            );
          }

          // Look for View and Current buttons
          const viewButtons = page.locator('button', { hasText: 'View' });
          const currentButtons = page.locator('button', { hasText: 'Current' });

          console.log(`🔘 View buttons found: ${await viewButtons.count()}`);
          console.log(
            `🔘 Current buttons found: ${await currentButtons.count()}`
          );

          // CRITICAL: Check if we can see multiple versions
          if (versionCount <= 1 && (await viewButtons.count()) === 0) {
            console.log(
              '🚨 ISSUE 1 CONFIRMED: Only seeing one version, no other versions to view'
            );
          }

          // Close modal for next test
          const closeButton = page
            .locator('button')
            .filter({ hasText: '✕' })
            .or(page.locator('button').filter({ hasText: 'Close' }));
          if ((await closeButton.count()) > 0) {
            await closeButton.first().click();
          }
        } else {
          console.log('❌ Version selector modal did not open');
        }
      }

      // Test version creation on shared recipe
      console.log('\n🔍 Testing version creation on shared recipe...');

      const createVersionButton = page.locator('button', {
        hasText: 'Create New Version',
      });
      console.log(
        `Create Version buttons found: ${await createVersionButton.count()}`
      );

      if ((await createVersionButton.count()) > 0) {
        console.log('✅ Found Create New Version button');
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
          console.log('✅ Attempted to create new version');

          // Check if we're now viewing the new version
          const newVersionBadge = page.locator('text=/Version \\d+/');
          if ((await newVersionBadge.count()) > 0) {
            const newVersion = await newVersionBadge.textContent();
            console.log(`📍 Now viewing: ${newVersion}`);
          }
        } else {
          console.log('❌ No Create Version button in modal');
        }
      } else {
        console.log('❌ No Create New Version button found on shared recipe');
      }
    } else {
      console.log('❌ Avocado Toast recipe not found');
    }

    console.log(
      '\n🔍 ISSUE 2: Testing version creation on unshared recipe (Personal Workout Smoothie)'
    );

    // Navigate back to home
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Look for Personal Workout Smoothie recipe (should be unshared)
    const smoothieCard = page
      .locator('[data-testid="recipe-card"]')
      .filter({ hasText: 'Personal Workout Smoothie' })
      .first();

    if ((await smoothieCard.count()) > 0) {
      console.log('✅ Found Personal Workout Smoothie recipe');
      await smoothieCard.click();
      await page.waitForLoadState('networkidle');

      // Check if this recipe is shared or not
      const shareButton = page.locator('button', { hasText: 'Share' });
      const makePublicButton = page.locator('button', {
        hasText: 'Make Public',
      });
      const isPublicIndicator = page.locator('text=/Public|Shared/i');

      console.log(`Share buttons: ${await shareButton.count()}`);
      console.log(`Make Public buttons: ${await makePublicButton.count()}`);
      console.log(`Public indicators: ${await isPublicIndicator.count()}`);

      if (
        (await shareButton.count()) > 0 ||
        (await makePublicButton.count()) > 0
      ) {
        console.log(
          '✅ Recipe appears to be unshared (has Share/Make Public button)'
        );
      }

      // Look for Create New Version button on unshared recipe
      const createVersionButton = page.locator('button', {
        hasText: 'Create New Version',
      });
      console.log(
        `Create Version buttons on unshared recipe: ${await createVersionButton.count()}`
      );

      if ((await createVersionButton.count()) === 0) {
        console.log(
          '🚨 ISSUE 2 CONFIRMED: Cannot create version on unshared recipe - no Create New Version button'
        );
      } else {
        console.log('✅ Create New Version button found on unshared recipe');
      }
    } else {
      console.log('❌ Personal Workout Smoothie recipe not found');
    }

    // Take comprehensive screenshots
    await page.screenshot({
      path: 'versioning-critical-issues-debug.png',
      fullPage: true,
    });
    console.log('📸 Screenshot saved as versioning-critical-issues-debug.png');

    console.log(
      '\n📋 INVESTIGATION COMPLETE - Check console output for issues found'
    );
  });
});
