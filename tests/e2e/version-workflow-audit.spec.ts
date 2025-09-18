import { test } from '@playwright/test';
import { TEST_USER } from './fixtures/auth';

test.describe('Version Workflow Systematic Audit', () => {
  test('comprehensive workflow validation from database to UI', async ({
    page,
  }) => {
    console.log('🔍 SYSTEMATIC VERSION WORKFLOW AUDIT');
    console.log('=====================================');

    // Navigate and authenticate
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    console.log('\n📋 AUDIT STEP 1: Authentication & Setup');

    // Handle authentication
    const signInButton = page.locator('button', { hasText: 'Sign In' });
    if ((await signInButton.count()) > 0) {
      console.log('🔐 Authenticating user...');
      await signInButton.click();
      await page.fill('input[type="email"]', TEST_USER.email);
      await page.fill('input[type="password"]', TEST_USER.password);
      await page.click('button[type="submit"]');
      await page.waitForLoadState('networkidle');
    }

    console.log('\n📋 AUDIT STEP 2: Create Original Recipe (v1)');

    // Create original recipe
    await page.goto('/create');
    await page.waitForLoadState('networkidle');

    // Wait for form to be fully loaded and visible
    await page.waitForSelector('input#title', { state: 'visible' });
    await page.waitForSelector('input[placeholder*="Ingredient"]', {
      state: 'visible',
    });
    await page.waitForSelector('textarea[name="instructions"]', {
      state: 'visible',
    });

    console.log('✅ Recipe form loaded and ready');

    // Fill form using more specific selectors
    await page.fill('input#title', 'Workflow Audit Recipe');
    await page.fill('input[placeholder*="Ingredient"]', 'Original ingredient');
    await page.fill('textarea[name="instructions"]', 'Original instructions');

    const saveButton = page.locator('button[type="submit"]');
    await saveButton.click();
    await page.waitForLoadState('networkidle');

    console.log('✅ Original recipe (v1) created');

    console.log('\n📋 AUDIT STEP 3: Test Version Creation on Private Recipe');

    // Navigate to the recipe
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const auditRecipe = page
      .locator('[data-testid="recipe-card"]')
      .filter({ hasText: 'Workflow Audit Recipe' })
      .first();

    if ((await auditRecipe.count()) > 0) {
      await auditRecipe.click();
      await page.waitForLoadState('networkidle');

      // Check if Create New Version button exists on PRIVATE recipe
      const createVersionButton = page.locator('button', {
        hasText: 'Create New Version',
      });
      const createVersionCount = await createVersionButton.count();

      console.log(
        `🔍 Create New Version buttons on PRIVATE recipe: ${createVersionCount}`
      );

      if (createVersionCount === 0) {
        console.log(
          '🚨 ISSUE 2 CONFIRMED: Cannot create version on private recipe'
        );
        console.log('📋 Available buttons on private recipe:');

        const allButtons = await page.locator('button').all();
        for (let i = 0; i < Math.min(allButtons.length, 15); i++) {
          const buttonText = await allButtons[i].textContent();
          if (buttonText && buttonText.trim()) {
            console.log(`  - "${buttonText.trim()}"`);
          }
        }
      }

      console.log('\n📋 AUDIT STEP 4: Make Recipe Public');

      // Make recipe public
      const shareButton = page.locator('button', { hasText: 'Share' });
      if ((await shareButton.count()) > 0) {
        console.log('📢 Making recipe public...');
        await shareButton.click();
        await page.waitForLoadState('networkidle');
        console.log('✅ Recipe is now public');
      }

      console.log('\n📋 AUDIT STEP 5: Test Version Creation on Public Recipe');

      // Check if Create New Version button now exists on PUBLIC recipe
      const createVersionButtonPublic = page.locator('button', {
        hasText: 'Create New Version',
      });
      const createVersionCountPublic = await createVersionButtonPublic.count();

      console.log(
        `🔍 Create New Version buttons on PUBLIC recipe: ${createVersionCountPublic}`
      );

      if (createVersionCountPublic > 0) {
        console.log('🔄 Creating version 2...');
        await createVersionButtonPublic.click();
        await page.waitForTimeout(1000);

        // Wait for version creation modal to be ready
        await page.waitForSelector('input#version-name', { state: 'visible' });
        await page.waitForSelector('textarea#changelog', { state: 'visible' });

        // Fill version creation form
        await page.fill('input#version-name', 'Audit Version 2');
        await page.fill(
          'textarea#changelog',
          'Added more ingredients for audit testing'
        );

        const createButton = page.locator('button', {
          hasText: 'Create Version',
        });
        await createButton.click();
        await page.waitForLoadState('networkidle');

        console.log('✅ Version 2 created');

        // Check what version we're now viewing
        const versionBadge = page.locator('text=/Version \\d+/');
        if ((await versionBadge.count()) > 0) {
          const currentVersion = await versionBadge.textContent();
          console.log(`📍 Currently viewing: ${currentVersion}`);
        }

        console.log(
          '\n📋 AUDIT STEP 6: Create Version 3 for Multi-Version Testing'
        );

        // Create version 3 for comprehensive testing
        const createVersionButton3 = page.locator('button', {
          hasText: 'Create New Version',
        });
        if ((await createVersionButton3.count()) > 0) {
          await createVersionButton3.click();
          await page.waitForTimeout(1000);

          await page.fill('input#version-name', 'Audit Version 3');
          await page.fill(
            'textarea#changelog',
            'Final version for comprehensive audit'
          );

          const createButton3 = page.locator('button', {
            hasText: 'Create Version',
          });
          await createButton3.click();
          await page.waitForLoadState('networkidle');

          console.log('✅ Version 3 created');
        }

        console.log('\n📋 AUDIT STEP 7: Test Version Viewing from v3');

        // Now we should be viewing v3 - test if we can see ALL versions
        const versionMenuButton = page
          .locator('button')
          .filter({ hasText: '⋮' });

        if ((await versionMenuButton.count()) > 0) {
          console.log('🔄 Opening version selector from v3...');
          await versionMenuButton.first().click();
          await page.waitForTimeout(1500);

          // Check version modal content
          const versionModal = page.locator('text="Recipe Versions"');
          if ((await versionModal.count()) > 0) {
            console.log('✅ Version selector opened');

            // Count all version elements
            const versionCards = page.locator('[data-testid="version-card"]');
            const versionCount = await versionCards.count();
            console.log(`📊 Version cards found: ${versionCount}`);

            // Count interaction buttons
            const viewButtons = page.locator('button', { hasText: 'View' });
            const currentButtons = page.locator('button', {
              hasText: 'Current',
            });

            console.log(`🔘 View buttons: ${await viewButtons.count()}`);
            console.log(`🔘 Current buttons: ${await currentButtons.count()}`);

            // CRITICAL AUDIT: Should see v3, v2, v1
            const expectedVersions = 3;
            const totalVersionButtons =
              (await viewButtons.count()) + (await currentButtons.count());

            console.log(`🎯 Expected versions: ${expectedVersions}`);
            console.log(`🎯 Actual version buttons: ${totalVersionButtons}`);

            if (totalVersionButtons < expectedVersions) {
              console.log('🚨 ISSUE 1 CONFIRMED: Missing versions in selector');
              console.log('📋 This indicates getRecipeVersions() API failure');

              // Log modal content for debugging
              const modalContent = await page
                .locator('.modal, [role="dialog"]')
                .first()
                .textContent();
              console.log(
                '📄 Version modal content:',
                modalContent?.substring(0, 500)
              );
            } else {
              console.log('✅ All versions visible in selector');
            }

            console.log('\n📋 AUDIT STEP 8: Test Version Navigation');

            // Test navigation to v1 (should be available via View button)
            if ((await viewButtons.count()) >= 2) {
              console.log('🔄 Testing navigation to v1...');

              // Click the last View button (should be v1)
              await viewButtons.last().click();
              await page.waitForLoadState('networkidle');

              // Check if we navigated to v1
              const newVersionBadge = page.locator('text=/Version \\d+/');
              if ((await newVersionBadge.count()) > 0) {
                const newVersion = await newVersionBadge.textContent();
                console.log(`📍 Navigated to: ${newVersion}`);

                // Test reverse navigation back to v3
                console.log('🔄 Testing reverse navigation to v3...');

                const versionMenuButton2 = page
                  .locator('button')
                  .filter({ hasText: '⋮' });
                if ((await versionMenuButton2.count()) > 0) {
                  await versionMenuButton2.first().click();
                  await page.waitForTimeout(1000);

                  const viewButtons2 = page.locator('button', {
                    hasText: 'View',
                  });
                  if ((await viewButtons2.count()) > 0) {
                    await viewButtons2.first().click(); // Should go to v3
                    await page.waitForLoadState('networkidle');

                    const finalVersionBadge = page.locator(
                      'text=/Version \\d+/'
                    );
                    if ((await finalVersionBadge.count()) > 0) {
                      const finalVersion =
                        await finalVersionBadge.textContent();
                      console.log(
                        `📍 Final navigation result: ${finalVersion}`
                      );
                    }
                  }
                }
              }
            } else {
              console.log(
                '❌ Cannot test navigation - insufficient View buttons'
              );
            }
          } else {
            console.log('❌ Version selector modal did not open');
          }
        } else {
          console.log('❌ No version menu button found');
        }
      } else {
        console.log('❌ No Create New Version button on public recipe');
      }
    } else {
      console.log('❌ Could not find audit recipe');
    }

    console.log('\n📋 AUDIT COMPLETE');
    console.log('================');

    // Take final screenshot
    await page.screenshot({
      path: 'version-workflow-audit-final.png',
      fullPage: true,
    });

    console.log('📸 Final audit screenshot saved');
  });
});
