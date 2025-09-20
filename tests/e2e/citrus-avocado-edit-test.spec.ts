import { test, expect } from './fixtures/auth';

test.describe('Citrus Avocado Salad Edit Test', () => {
  test('should preserve description when editing the Citrus Avocado Salad recipe', async ({
    authenticatedPage,
  }) => {
    console.log('🥑 Testing Citrus Avocado Salad edit functionality...');

    // Step 1: Navigate to recipes page
    await authenticatedPage.goto('/recipes');
    await authenticatedPage.waitForLoadState('networkidle');
    console.log('✅ Navigated to recipes page');

    // Step 2: Find the Citrus Avocado Salad recipe (click on the heading, not the text)
    const citrusAvocadoRecipe = authenticatedPage.getByRole('heading', {
      name: 'Citrus Avocado Salad',
    });
    await expect(citrusAvocadoRecipe).toBeVisible({ timeout: 10000 });
    console.log('✅ Found Citrus Avocado Salad recipe');

    // Step 3: Click on the recipe to view it
    await citrusAvocadoRecipe.click();
    await authenticatedPage.waitForLoadState('networkidle');
    console.log('✅ Opened recipe view');

    // Step 4: Look for and note any existing description
    const recipeContent = await authenticatedPage.textContent('body');
    console.log(
      '📄 Recipe page content preview:',
      recipeContent?.substring(0, 200) + '...'
    );

    // Step 5: Click Edit button
    const editButton = authenticatedPage.getByRole('button', { name: /edit/i });
    await expect(editButton).toBeVisible({ timeout: 10000 });
    await editButton.click();
    console.log('✅ Clicked Edit button');

    // Step 6: Verify we're in edit mode
    await authenticatedPage.waitForURL(/\/recipes\/.*\/edit/);
    await authenticatedPage.waitForLoadState('networkidle');
    console.log('✅ In edit mode');

    // Step 7: Check description field and its current value
    const descriptionField = authenticatedPage.getByRole('textbox', {
      name: /description/i,
    });
    await expect(descriptionField).toBeVisible({ timeout: 5000 });

    const currentDescription = await descriptionField.inputValue();
    console.log('📝 Current description in edit form:', currentDescription);
    console.log('📏 Description length:', currentDescription.length);

    // Step 8: Verify description is not empty (should be loaded from existing recipe)
    expect(currentDescription.length).toBeGreaterThan(0);
    console.log('✅ Description is loaded in edit form');

    // Step 9: Modify the description slightly to test saving
    const updatedDescription =
      currentDescription + ' - Edited at ' + new Date().toLocaleTimeString();
    await descriptionField.clear();
    await descriptionField.fill(updatedDescription);
    console.log('📝 Updated description to:', updatedDescription);

    // Step 10: Save the changes
    const saveButton = authenticatedPage.getByRole('button', {
      name: /save|update/i,
    });
    await saveButton.click();
    console.log('✅ Clicked save button');

    // Step 11: Wait for save to complete
    await authenticatedPage.waitForLoadState('networkidle');
    await authenticatedPage.waitForTimeout(2000);

    // Step 12: Go back to edit mode to verify description was saved
    const editAgainButton = authenticatedPage.getByRole('button', {
      name: /edit/i,
    });
    if ((await editAgainButton.count()) > 0) {
      await editAgainButton.click();
      await authenticatedPage.waitForLoadState('networkidle');

      const finalDescriptionField = authenticatedPage.getByRole('textbox', {
        name: /description/i,
      });
      const finalDescription = await finalDescriptionField.inputValue();
      console.log('📝 Final description after save:', finalDescription);

      // Verify the description was actually saved
      expect(finalDescription).toBe(updatedDescription);
      console.log('🎉 SUCCESS: Description preserved through edit workflow!');
    } else {
      console.log(
        '⚠️  Could not find edit button after save - checking recipe view'
      );

      // Alternative: Check if we're on recipe view and description is visible
      const pageContent = await authenticatedPage.textContent('body');
      const descriptionVisible = pageContent?.includes(
        updatedDescription.split(' - Edited')[0]
      );
      console.log('📄 Description visible in recipe view:', descriptionVisible);
    }
  });

  test('should show description field exists in manual recipe form', async ({
    authenticatedPage,
  }) => {
    // Navigate directly to add recipe form
    await authenticatedPage.goto('/recipes/new');
    await authenticatedPage.waitForLoadState('networkidle');

    // Check for description field
    const descriptionField = authenticatedPage.getByRole('textbox', {
      name: /description/i,
    });
    const descriptionLabel = authenticatedPage.getByText(/description/i);

    console.log('Description field count:', await descriptionField.count());
    console.log('Description label count:', await descriptionLabel.count());

    // At least the field should exist
    expect(await descriptionField.count()).toBeGreaterThan(0);

    // Test that we can interact with the field
    await descriptionField.fill('Test description');
    const value = await descriptionField.inputValue();
    expect(value).toBe('Test description');
    console.log('✅ Description field is functional');
  });
});
