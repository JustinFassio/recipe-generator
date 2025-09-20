import { test, expect } from './fixtures/auth';

test.describe('AI Recipe Description Complete Workflow', () => {
  test('should create recipe via AI, parse with description, save, then edit preserving description', async ({
    authenticatedPage,
  }) => {
    console.log('🤖 Starting AI Recipe Creation workflow test...');

    // Step 1: Navigate to AI Recipe Creator
    await authenticatedPage.goto('/');
    await authenticatedPage.waitForLoadState('networkidle');

    // Step 2: Access chat interface (AI Recipe Creator)
    // Look for chat input or navigate to chat page
    let chatInput = authenticatedPage.getByRole('textbox', {
      name: /message|chat|type.*message/i,
    });

    if ((await chatInput.count()) === 0) {
      // Navigate to chat page if not already there
      await authenticatedPage.goto('/chat');
      await authenticatedPage.waitForLoadState('networkidle');
      chatInput = authenticatedPage.getByRole('textbox', {
        name: /message|chat|type.*message/i,
      });
    }

    await expect(chatInput).toBeVisible({ timeout: 10000 });
    console.log('✅ Chat interface found');

    // Step 3: Send message to AI to create a recipe
    await chatInput.fill(
      'Create a delicious spaghetti carbonara recipe with a rich description'
    );

    const sendButton = authenticatedPage.getByRole('button', { name: /send/i });
    await sendButton.click();
    console.log('✅ Message sent to AI');

    // Step 4: Wait for AI response and look for "Save Recipe" button
    await authenticatedPage.waitForTimeout(8000); // Give AI time to respond

    const saveRecipeButton = authenticatedPage.getByRole('button', {
      name: /save.*recipe/i,
    });
    await expect(saveRecipeButton).toBeVisible({ timeout: 15000 });
    console.log('✅ AI provided recipe, Save Recipe button visible');

    // Step 5: Parse the recipe (click Save Recipe)
    await saveRecipeButton.click();
    await authenticatedPage.waitForLoadState('networkidle');
    console.log('✅ Recipe parsing initiated');

    // Step 6: Should navigate to recipe form with parsed data
    await expect(authenticatedPage).toHaveURL(/\/recipes\/new/);
    await authenticatedPage.waitForLoadState('networkidle');
    console.log('✅ Navigated to recipe form');

    // Step 7: Verify description field is populated from AI
    const descriptionField = authenticatedPage.getByRole('textbox', {
      name: /description/i,
    });
    await expect(descriptionField).toBeVisible({ timeout: 5000 });

    const originalDescription = await descriptionField.inputValue();
    console.log('📝 Original AI description:', originalDescription);

    // Description should be populated from AI parsing
    expect(originalDescription.length).toBeGreaterThan(10);

    // Step 8: Save the recipe
    const saveButton = authenticatedPage.getByRole('button', {
      name: /save|create/i,
    });
    await saveButton.click();
    console.log('✅ Recipe saved');

    // Step 9: Wait for redirect to recipes list
    await authenticatedPage.waitForURL(/\/recipes/);
    await authenticatedPage.waitForLoadState('networkidle');
    await authenticatedPage.waitForTimeout(2000);

    // Step 10: Find and open the recipe we just created
    const recipeCards = authenticatedPage.locator(
      '[data-testid="recipe-card"]'
    );

    if ((await recipeCards.count()) > 0) {
      await recipeCards.first().click();
      await authenticatedPage.waitForLoadState('networkidle');
      console.log('✅ Opened saved recipe');

      // Step 11: Click Edit button
      const editButton = authenticatedPage.getByRole('button', {
        name: /edit/i,
      });
      await expect(editButton).toBeVisible({ timeout: 5000 });
      await editButton.click();
      console.log('✅ Clicked Edit button');

      // Step 12: Verify we're in edit mode and description is preserved
      await authenticatedPage.waitForURL(/\/recipes\/.*\/edit/);
      await authenticatedPage.waitForLoadState('networkidle');

      const editDescriptionField = authenticatedPage.getByRole('textbox', {
        name: /description/i,
      });
      await expect(editDescriptionField).toBeVisible({ timeout: 5000 });

      const editDescriptionValue = await editDescriptionField.inputValue();
      console.log('📝 Description in edit mode:', editDescriptionValue);

      // CRITICAL: Verify description is preserved in edit mode
      expect(editDescriptionValue).toBe(originalDescription);
      console.log('✅ Description preserved in edit mode!');

      // Step 13: Modify description and save
      const updatedDescription = originalDescription + ' - Updated via edit';
      await editDescriptionField.clear();
      await editDescriptionField.fill(updatedDescription);

      const saveEditButton = authenticatedPage.getByRole('button', {
        name: /save|update/i,
      });
      await saveEditButton.click();
      console.log('✅ Saved edited recipe with updated description');

      // Step 14: Verify description persists after edit save
      await authenticatedPage.waitForLoadState('networkidle');
      await authenticatedPage.waitForTimeout(2000);

      // Go back to edit to verify the description was actually saved
      const editAgainButton = authenticatedPage.getByRole('button', {
        name: /edit/i,
      });
      if ((await editAgainButton.count()) > 0) {
        await editAgainButton.click();
        await authenticatedPage.waitForLoadState('networkidle');

        const finalDescriptionField = authenticatedPage.getByRole('textbox', {
          name: /description/i,
        });
        const finalDescriptionValue = await finalDescriptionField.inputValue();
        console.log(
          '📝 Final description after edit save:',
          finalDescriptionValue
        );

        // Verify the updated description was saved
        expect(finalDescriptionValue).toBe(updatedDescription);
        console.log('🎉 Complete workflow successful!');
      }
    } else {
      console.log('❌ No recipe cards found after creation');
      throw new Error('Recipe was not created or not visible in the list');
    }
  });
});
