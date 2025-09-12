import { test, expect } from './fixtures/auth';
import { TEST_USERS } from './utils/test-user-setup';

test.describe('Profile Management', () => {
  test.describe('Profile Page Access', () => {
    test('should access profile page for authenticated user', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/profile');
      await expect(authenticatedPage).toHaveURL('/profile');
      
      // Check for profile page elements
      await expect(authenticatedPage.getByRole('heading', { name: /profile/i })).toBeVisible();
    });

    test('should redirect unauthenticated users from profile page', async ({ page }) => {
      await page.goto('/profile');
      await expect(page).toHaveURL('/auth/signin');
    });
  });

  test.describe('Profile Information Updates', () => {
    test('should update full name', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/profile');
      
      // Find the full name input
      const fullNameInput = authenticatedPage.getByRole('textbox', { name: /full name/i });
      await expect(fullNameInput).toBeVisible();
      
      // Clear and update the full name
      await fullNameInput.clear();
      await fullNameInput.fill('Updated Test User');
      
      // Submit the form
      const submitButton = authenticatedPage.getByRole('button', { name: /save|update/i });
      await submitButton.click();
      
      // Wait for success message or form submission
      await expect(authenticatedPage.getByText(/success|updated/i)).toBeVisible({ timeout: 10000 });
    });

    test('should update bio', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/profile');
      
      // Find the bio textarea
      const bioTextarea = authenticatedPage.getByRole('textbox', { name: /bio/i });
      await expect(bioTextarea).toBeVisible();
      
      // Update the bio
      await bioTextarea.clear();
      await bioTextarea.fill('This is my updated bio for testing purposes.');
      
      // Save the bio
      const saveBioButton = authenticatedPage.getByRole('button', { name: /save.*bio/i });
      await saveBioButton.click();
      
      // Wait for success message
      await expect(authenticatedPage.getByText(/success|saved/i)).toBeVisible({ timeout: 10000 });
    });

    test('should update location information', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/profile');
      
      // Update country
      const countrySelect = authenticatedPage.getByRole('combobox', { name: /country/i });
      if (await countrySelect.count() > 0) {
        await countrySelect.click();
        await authenticatedPage.getByRole('option', { name: /united states/i }).click();
      }
      
      // Update city
      const cityInput = authenticatedPage.getByRole('textbox', { name: /city/i });
      if (await cityInput.count() > 0) {
        await cityInput.clear();
        await cityInput.fill('San Francisco');
      }
      
      // Submit the form
      const submitButton = authenticatedPage.getByRole('button', { name: /save|update/i });
      await submitButton.click();
      
      // Wait for success message
      await expect(authenticatedPage.getByText(/success|updated/i)).toBeVisible({ timeout: 10000 });
    });

    test('should update cooking preferences', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/profile');
      
      // Look for cooking preferences section
      const cookingSection = authenticatedPage.getByText(/cooking|preferences/i);
      if (await cookingSection.count() > 0) {
        // Update skill level
        const skillLevelSelect = authenticatedPage.getByRole('combobox', { name: /skill.*level/i });
        if (await skillLevelSelect.count() > 0) {
          await skillLevelSelect.click();
          await authenticatedPage.getByRole('option', { name: /intermediate/i }).click();
        }
        
        // Update time per meal
        const timeSlider = authenticatedPage.getByRole('slider', { name: /time.*meal/i });
        if (await timeSlider.count() > 0) {
          await timeSlider.fill('45');
        }
        
        // Save cooking preferences
        const saveCookingButton = authenticatedPage.getByRole('button', { name: /save.*cooking/i });
        if (await saveCookingButton.count() > 0) {
          await saveCookingButton.click();
          await expect(authenticatedPage.getByText(/success|saved/i)).toBeVisible({ timeout: 10000 });
        }
      }
    });

    test('should update safety preferences', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/profile');
      
      // Look for safety section
      const safetySection = authenticatedPage.getByText(/allergies|dietary|safety/i);
      if (await safetySection.count() > 0) {
        // Add an allergy
        const allergyInput = authenticatedPage.getByRole('textbox', { name: /allerg/i });
        if (await allergyInput.count() > 0) {
          await allergyInput.fill('peanuts');
          await authenticatedPage.keyboard.press('Enter');
        }
        
        // Add dietary restriction
        const dietaryInput = authenticatedPage.getByRole('textbox', { name: /dietary/i });
        if (await dietaryInput.count() > 0) {
          await dietaryInput.fill('vegetarian');
          await authenticatedPage.keyboard.press('Enter');
        }
        
        // Save safety preferences
        const saveSafetyButton = authenticatedPage.getByRole('button', { name: /save.*safety/i });
        if (await saveSafetyButton.count() > 0) {
          await saveSafetyButton.click();
          await expect(authenticatedPage.getByText(/success|saved/i)).toBeVisible({ timeout: 10000 });
        }
      }
    });
  });

  test.describe('Profile Data Persistence', () => {
    test('should persist profile changes after page refresh', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/profile');
      
      // Update full name
      const fullNameInput = authenticatedPage.getByRole('textbox', { name: /full name/i });
      await fullNameInput.clear();
      await fullNameInput.fill('Persistent Test User');
      
      // Submit the form
      const submitButton = authenticatedPage.getByRole('button', { name: /save|update/i });
      await submitButton.click();
      
      // Wait for success message
      await expect(authenticatedPage.getByText(/success|updated/i)).toBeVisible({ timeout: 10000 });
      
      // Refresh the page
      await authenticatedPage.reload();
      
      // Verify the change persisted
      await expect(fullNameInput).toHaveValue('Persistent Test User');
    });

    test('should maintain profile data across navigation', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/profile');
      
      // Update bio
      const bioTextarea = authenticatedPage.getByRole('textbox', { name: /bio/i });
      await bioTextarea.clear();
      await bioTextarea.fill('Navigation test bio');
      
      // Save bio
      const saveBioButton = authenticatedPage.getByRole('button', { name: /save.*bio/i });
      await saveBioButton.click();
      
      // Wait for success
      await expect(authenticatedPage.getByText(/success|saved/i)).toBeVisible({ timeout: 10000 });
      
      // Navigate away and back
      await authenticatedPage.goto('/recipes');
      await authenticatedPage.goto('/profile');
      
      // Verify bio is still there
      await expect(bioTextarea).toHaveValue('Navigation test bio');
    });
  });

  test.describe('Profile Validation', () => {
    test('should validate full name length', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/profile');
      
      const fullNameInput = authenticatedPage.getByRole('textbox', { name: /full name/i });
      
      // Try to enter a very long name
      const longName = 'A'.repeat(100);
      await fullNameInput.clear();
      await fullNameInput.fill(longName);
      
      // Check for validation error
      await expect(authenticatedPage.getByText(/80 characters or less/i)).toBeVisible();
    });

    test('should validate username format', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/profile');
      
      // Look for username input (if available)
      const usernameInput = authenticatedPage.getByRole('textbox', { name: /username/i });
      if (await usernameInput.count() > 0) {
        await usernameInput.clear();
        await usernameInput.fill('Invalid Username!');
        
        // Check for validation error
        await expect(authenticatedPage.getByText(/invalid|format/i)).toBeVisible();
      }
    });
  });

  test.describe('Profile Loading States', () => {
    test('should show loading state during profile update', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/profile');
      
      const fullNameInput = authenticatedPage.getByRole('textbox', { name: /full name/i });
      await fullNameInput.clear();
      await fullNameInput.fill('Loading Test User');
      
      const submitButton = authenticatedPage.getByRole('button', { name: /save|update/i });
      await submitButton.click();
      
      // Check for loading state
      await expect(submitButton).toBeDisabled();
      await expect(authenticatedPage.getByText(/loading|saving/i)).toBeVisible();
    });

    test('should handle profile update errors gracefully', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/profile');
      
      // Try to submit with invalid data
      const fullNameInput = authenticatedPage.getByRole('textbox', { name: /full name/i });
      await fullNameInput.clear();
      await fullNameInput.fill('A'.repeat(100)); // Too long
      
      const submitButton = authenticatedPage.getByRole('button', { name: /save|update/i });
      await submitButton.click();
      
      // Should show validation error instead of submitting
      await expect(authenticatedPage.getByText(/80 characters or less/i)).toBeVisible();
    });
  });

  test.describe('Profile Avatar', () => {
    test('should display avatar upload section', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/profile');
      
      // Look for avatar section
      const avatarSection = authenticatedPage.getByText(/avatar|photo|picture/i);
      await expect(avatarSection).toBeVisible();
    });

    test('should show avatar upload button', async ({ authenticatedPage }) => {
      await authenticatedPage.goto('/profile');
      
      // Look for upload button
      const uploadButton = authenticatedPage.getByRole('button', { name: /upload|change.*avatar/i });
      await expect(uploadButton).toBeVisible();
    });
  });
});
