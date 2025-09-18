import { test } from '@playwright/test';
import { TEST_USER } from './fixtures/auth';

test.describe('Recipe Version Viewing Debug', () => {
  test('investigate version viewing issue with Avocado Toast recipe', async ({
    page,
  }) => {
    // Navigate to the app
    await page.goto('/');

    console.log('🔍 Starting version viewing investigation...');

    // Look for Avocado Toast recipe
    await page.waitForLoadState('networkidle');

    // Try to find the Avocado Toast recipe
    const avocadoToastCard = page
      .locator('[data-testid="recipe-card"]')
      .filter({ hasText: 'Avocado Toast' })
      .first();

    if ((await avocadoToastCard.count()) === 0) {
      console.log('❌ No Avocado Toast recipe found on homepage');

      // Check if we need to sign in first
      const signInButton = page.locator('button', { hasText: 'Sign In' });
      if ((await signInButton.count()) > 0) {
        console.log('🔐 Need to sign in first');
        await signInButton.click();

        // Try to sign in with test credentials (if they exist)
        await page.fill('input[type="email"]', TEST_USER.email);
        await page.fill('input[type="password"]', TEST_USER.password);
        await page.click('button[type="submit"]');
        await page.waitForLoadState('networkidle');
      }

      // Try to find recipe again
      const avocadoToastCardAfterAuth = page
        .locator('[data-testid="recipe-card"]')
        .filter({ hasText: 'Avocado Toast' })
        .first();
      if ((await avocadoToastCardAfterAuth.count()) === 0) {
        console.log(
          '❌ Still no Avocado Toast recipe found - may need to create test data'
        );
        return;
      }
    }

    console.log('✅ Found Avocado Toast recipe');

    // Click on the recipe to view it
    await avocadoToastCard.click();
    await page.waitForLoadState('networkidle');

    // Check what version we're viewing
    const versionBadge = page.locator('[data-testid="version-badge"]');
    if ((await versionBadge.count()) > 0) {
      const versionText = await versionBadge.textContent();
      console.log(`📍 Currently viewing: ${versionText}`);
    } else {
      console.log('⚠️ No version badge found');
    }

    // Look for version selector (3 dots menu)
    const versionMenuButton = page.locator(
      '[data-testid="version-menu-button"]'
    );
    if ((await versionMenuButton.count()) === 0) {
      console.log('❌ No version menu button found');

      // Try alternative selectors
      const threeDots = page.locator('button').filter({ hasText: '⋮' });
      const moreButton = page.locator('button').filter({ hasText: 'more' });
      const versionButton = page
        .locator('button')
        .filter({ hasText: 'version' });

      console.log(`Three dots buttons: ${await threeDots.count()}`);
      console.log(`More buttons: ${await moreButton.count()}`);
      console.log(`Version buttons: ${await versionButton.count()}`);

      if ((await threeDots.count()) > 0) {
        console.log('✅ Found three dots button');
        await threeDots.first().click();
      } else {
        console.log('❌ No version selector found at all');
        return;
      }
    } else {
      await versionMenuButton.click();
    }

    await page.waitForTimeout(1000); // Wait for modal to open

    // Check if version selector modal opened
    const versionModal = page.locator('[data-testid="version-modal"]');
    const modalTitle = page.locator('h2', { hasText: 'Recipe Versions' });

    if ((await versionModal.count()) > 0 || (await modalTitle.count()) > 0) {
      console.log('✅ Version selector modal opened');

      // Count how many versions are shown
      const versionCards = page.locator('[data-testid="version-card"]');
      const versionCount = await versionCards.count();
      console.log(`📊 Number of versions shown: ${versionCount}`);

      // List all versions
      for (let i = 0; i < versionCount; i++) {
        const versionCard = versionCards.nth(i);
        const versionNumber = await versionCard
          .locator('[data-testid="version-number"]')
          .textContent();
        const versionName = await versionCard
          .locator('[data-testid="version-name"]')
          .textContent();
        const viewButton = versionCard.locator('button', { hasText: 'View' });
        const currentButton = versionCard.locator('button', {
          hasText: 'Current',
        });

        const hasViewButton = (await viewButton.count()) > 0;
        const hasCurrentButton = (await currentButton.count()) > 0;

        console.log(`Version ${i + 1}: ${versionNumber} - ${versionName}`);
        console.log(`  - Has View button: ${hasViewButton}`);
        console.log(`  - Has Current button: ${hasCurrentButton}`);
      }

      // Try to click on a different version if available
      const viewButtons = page.locator('button', { hasText: 'View' });
      if ((await viewButtons.count()) > 0) {
        console.log('🔄 Attempting to view different version...');
        await viewButtons.first().click();
        await page.waitForLoadState('networkidle');

        // Check if we navigated to a different version
        const newVersionBadge = page.locator('[data-testid="version-badge"]');
        if ((await newVersionBadge.count()) > 0) {
          const newVersionText = await newVersionBadge.textContent();
          console.log(`📍 Now viewing: ${newVersionText}`);
        }
      } else {
        console.log('❌ No "View" buttons found - cannot switch versions');
      }
    } else {
      console.log('❌ Version selector modal did not open');
    }

    // Take a screenshot for debugging
    await page.screenshot({
      path: 'version-viewing-debug.png',
      fullPage: true,
    });
    console.log('📸 Screenshot saved as version-viewing-debug.png');
  });
});
