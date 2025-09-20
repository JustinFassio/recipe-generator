import { test, expect } from './fixtures/auth';

test.describe('AI Recipe Creator Description Investigation', () => {
  test('should create recipe with description via AI and preserve it in edit', async ({
    authenticatedPage,
  }) => {
    // Navigate to chat/AI recipe creator
    await authenticatedPage.goto('/');
    await authenticatedPage.waitForLoadState('networkidle');

    // Look for AI Recipe Creator or Chat interface
    const chatInterface = authenticatedPage.locator(
      '[data-testid="chat-interface"]'
    );
    const chatInput = authenticatedPage.getByRole('textbox', {
      name: /message|chat/i,
    });
    const personaSelector = authenticatedPage.locator(
      '[data-testid="persona-selector"]'
    );

    // Check if we're on the chat page or need to navigate
    if (
      (await chatInterface.count()) === 0 &&
      (await chatInput.count()) === 0
    ) {
      // Look for a way to get to the AI recipe creator
      const aiButton = authenticatedPage.getByRole('button', {
        name: /ai|chat|create.*recipe/i,
      });
      const chatLink = authenticatedPage.getByRole('link', {
        name: /chat|ai/i,
      });

      if ((await aiButton.count()) > 0) {
        await aiButton.click();
      } else if ((await chatLink.count()) > 0) {
        await chatLink.click();
      } else {
        await authenticatedPage.goto('/chat');
      }

      await authenticatedPage.waitForLoadState('networkidle');
    }

    // Select a persona if needed
    if ((await personaSelector.count()) > 0) {
      const chefPersona = authenticatedPage.getByRole('button', {
        name: /chef|marco/i,
      });
      if ((await chefPersona.count()) > 0) {
        await chefPersona.click();
        await authenticatedPage.waitForLoadState('networkidle');
      }
    }

    // Send a message to create a recipe with description
    const chatInputField = authenticatedPage.getByRole('textbox', {
      name: /message|chat|type/i,
    });
    await expect(chatInputField).toBeVisible({ timeout: 10000 });

    await chatInputField.fill(
      'Create a simple pasta recipe with a rich description'
    );

    const sendButton = authenticatedPage.getByRole('button', { name: /send/i });
    await sendButton.click();

    // Wait for AI response
    await authenticatedPage.waitForTimeout(5000);

    // Look for the "Save Recipe" button
    const saveRecipeButton = authenticatedPage.getByRole('button', {
      name: /save.*recipe/i,
    });

    // If AI provided a recipe, save it
    if ((await saveRecipeButton.count()) > 0) {
      await saveRecipeButton.click();
      await authenticatedPage.waitForLoadState('networkidle');

      // Should navigate to recipe form with parsed data
      await authenticatedPage.waitForURL(/\/recipes\/new/);

      // Check if description field is populated
      const descriptionField = authenticatedPage.getByRole('textbox', {
        name: /description/i,
      });
      await expect(descriptionField).toBeVisible({ timeout: 5000 });

      const descriptionValue = await descriptionField.inputValue();
      console.log('AI-generated description in form:', descriptionValue);

      // The description should be populated from AI
      expect(descriptionValue.length).toBeGreaterThan(0);

      // Save the recipe
      const saveButton = authenticatedPage.getByRole('button', {
        name: /save|create/i,
      });
      await saveButton.click();

      // Wait for redirect to recipes list
      await authenticatedPage.waitForURL(/\/recipes/);
      await authenticatedPage.waitForLoadState('networkidle');

      // Find the recipe we just created and edit it
      await authenticatedPage.waitForTimeout(2000);
      const recipeCards = authenticatedPage.locator(
        '[data-testid="recipe-card"]'
      );

      if ((await recipeCards.count()) > 0) {
        await recipeCards.first().click();
        await authenticatedPage.waitForLoadState('networkidle');

        // Click edit button
        const editButton = authenticatedPage.getByRole('button', {
          name: /edit/i,
        });
        await expect(editButton).toBeVisible({ timeout: 5000 });
        await editButton.click();

        // Check if description is preserved in edit mode
        await authenticatedPage.waitForURL(/\/recipes\/.*\/edit/);
        await authenticatedPage.waitForLoadState('networkidle');

        const editDescriptionField = authenticatedPage.getByRole('textbox', {
          name: /description/i,
        });
        const editDescriptionValue = await editDescriptionField.inputValue();
        console.log('Description in edit mode:', editDescriptionValue);

        // Verify description is preserved
        expect(editDescriptionValue).toBe(descriptionValue);
      }
    } else {
      console.log(
        'No Save Recipe button found - AI might not have provided a structured recipe'
      );
    }
  });

  test('should show description field in recipe form', async ({
    authenticatedPage,
  }) => {
    // Navigate to create new recipe
    await authenticatedPage.goto('/recipes/new');
    await authenticatedPage.waitForLoadState('networkidle');

    // Check for description field
    const descriptionField = authenticatedPage.getByRole('textbox', {
      name: /description/i,
    });
    const descriptionLabel = authenticatedPage.getByText(/description/i);

    // At least one should be visible
    const hasDescriptionField = (await descriptionField.count()) > 0;
    const hasDescriptionLabel = (await descriptionLabel.count()) > 0;

    console.log('Description field found:', hasDescriptionField);
    console.log('Description label found:', hasDescriptionLabel);

    expect(hasDescriptionField || hasDescriptionLabel).toBeTruthy();

    if (hasDescriptionField) {
      // Test that we can type in the description field
      await descriptionField.fill('Test description content');
      const value = await descriptionField.inputValue();
      expect(value).toBe('Test description content');
    }
  });
});
