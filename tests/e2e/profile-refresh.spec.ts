import { test, expect } from './fixtures/auth';
import { TEST_USERS } from './utils/test-user-setup';

test.describe('Profile Refresh and Update', () => {
  test('should refresh profile data after updates', async ({ authenticatedPage }) => {
    // Navigate to profile page
    await authenticatedPage.goto('/profile');
    
    // Wait for profile to load
    await authenticatedPage.waitForLoadState('networkidle');
    
    // Get initial full name value
    const fullNameInput = authenticatedPage.getByRole('textbox', { name: /full name/i });
    const initialName = await fullNameInput.inputValue();
    
    // Update the full name
    const newName = `Updated User ${Date.now()}`;
    await fullNameInput.clear();
    await fullNameInput.fill(newName);
    
    // Submit the form
    const submitButton = authenticatedPage.getByRole('button', { name: /save|update/i });
    await submitButton.click();
    
    // Wait for success message
    await expect(authenticatedPage.getByText(/success|updated/i)).toBeVisible({ timeout: 10000 });
    
    // Wait a moment for the update to process
    await authenticatedPage.waitForTimeout(1000);
    
    // Verify the input still shows the updated value (profile refresh worked)
    await expect(fullNameInput).toHaveValue(newName);
  });

  test('should refresh profile data on page reload', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/profile');
    
    // Update bio
    const bioTextarea = authenticatedPage.getByRole('textbox', { name: /bio/i });
    const newBio = `Test bio updated at ${new Date().toISOString()}`;
    await bioTextarea.clear();
    await bioTextarea.fill(newBio);
    
    // Save bio
    const saveBioButton = authenticatedPage.getByRole('button', { name: /save.*bio/i });
    await saveBioButton.click();
    
    // Wait for success
    await expect(authenticatedPage.getByText(/success|saved/i)).toBeVisible({ timeout: 10000 });
    
    // Reload the page
    await authenticatedPage.reload();
    
    // Wait for page to load
    await authenticatedPage.waitForLoadState('networkidle');
    
    // Verify bio was refreshed from server
    await expect(bioTextarea).toHaveValue(newBio);
  });

  test('should maintain profile state across tab switches', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/profile');
    
    // Update full name
    const fullNameInput = authenticatedPage.getByRole('textbox', { name: /full name/i });
    const newName = `Tab Test User ${Date.now()}`;
    await fullNameInput.clear();
    await fullNameInput.fill(newName);
    
    // Submit the form
    const submitButton = authenticatedPage.getByRole('button', { name: /save|update/i });
    await submitButton.click();
    
    // Wait for success
    await expect(authenticatedPage.getByText(/success|updated/i)).toBeVisible({ timeout: 10000 });
    
    // Switch to another tab (if available)
    const tabs = authenticatedPage.locator('[role="tab"]');
    if (await tabs.count() > 1) {
      await tabs.nth(1).click();
      await authenticatedPage.waitForTimeout(500);
      await tabs.first().click();
      
      // Verify the data is still there
      await expect(fullNameInput).toHaveValue(newName);
    }
  });

  test('should refresh profile data when navigating back to profile', async ({ authenticatedPage }) => {
    // Start at profile page
    await authenticatedPage.goto('/profile');
    
    // Update location
    const cityInput = authenticatedPage.getByRole('textbox', { name: /city/i });
    if (await cityInput.count() > 0) {
      const newCity = `Test City ${Date.now()}`;
      await cityInput.clear();
      await cityInput.fill(newCity);
      
      // Submit form
      const submitButton = authenticatedPage.getByRole('button', { name: /save|update/i });
      await submitButton.click();
      
      // Wait for success
      await expect(authenticatedPage.getByText(/success|updated/i)).toBeVisible({ timeout: 10000 });
      
      // Navigate away
      await authenticatedPage.goto('/recipes');
      await authenticatedPage.waitForLoadState('networkidle');
      
      // Navigate back to profile
      await authenticatedPage.goto('/profile');
      await authenticatedPage.waitForLoadState('networkidle');
      
      // Verify the data was refreshed from server
      await expect(cityInput).toHaveValue(newCity);
    }
  });

  test('should handle profile refresh errors gracefully', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/profile');
    
    // Simulate a network error by going offline
    await authenticatedPage.context().setOffline(true);
    
    // Try to update profile
    const fullNameInput = authenticatedPage.getByRole('textbox', { name: /full name/i });
    await fullNameInput.clear();
    await fullNameInput.fill('Offline Test');
    
    const submitButton = authenticatedPage.getByRole('button', { name: /save|update/i });
    await submitButton.click();
    
    // Should show error message
    await expect(authenticatedPage.getByText(/error|failed|offline/i)).toBeVisible({ timeout: 10000 });
    
    // Go back online
    await authenticatedPage.context().setOffline(false);
    
    // Try again
    await submitButton.click();
    
    // Should succeed this time
    await expect(authenticatedPage.getByText(/success|updated/i)).toBeVisible({ timeout: 10000 });
  });

  test('should refresh multiple profile sections independently', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/profile');
    
    // Update bio
    const bioTextarea = authenticatedPage.getByRole('textbox', { name: /bio/i });
    const newBio = `Multi-section bio ${Date.now()}`;
    await bioTextarea.clear();
    await bioTextarea.fill(newBio);
    
    // Save bio
    const saveBioButton = authenticatedPage.getByRole('button', { name: /save.*bio/i });
    await saveBioButton.click();
    
    // Wait for bio success
    await expect(authenticatedPage.getByText(/success|saved/i)).toBeVisible({ timeout: 10000 });
    
    // Update full name
    const fullNameInput = authenticatedPage.getByRole('textbox', { name: /full name/i });
    const newName = `Multi-section User ${Date.now()}`;
    await fullNameInput.clear();
    await fullNameInput.fill(newName);
    
    // Submit profile form
    const submitButton = authenticatedPage.getByRole('button', { name: /save|update/i });
    await submitButton.click();
    
    // Wait for profile success
    await expect(authenticatedPage.getByText(/success|updated/i)).toBeVisible({ timeout: 10000 });
    
    // Reload page
    await authenticatedPage.reload();
    await authenticatedPage.waitForLoadState('networkidle');
    
    // Verify both sections were refreshed
    await expect(bioTextarea).toHaveValue(newBio);
    await expect(fullNameInput).toHaveValue(newName);
  });

  test('should show loading states during profile refresh', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/profile');
    
    // Update profile
    const fullNameInput = authenticatedPage.getByRole('textbox', { name: /full name/i });
    await fullNameInput.clear();
    await fullNameInput.fill('Loading State Test');
    
    const submitButton = authenticatedPage.getByRole('button', { name: /save|update/i });
    await submitButton.click();
    
    // Check for loading state
    await expect(submitButton).toBeDisabled();
    await expect(authenticatedPage.getByText(/loading|saving|updating/i)).toBeVisible();
    
    // Wait for completion
    await expect(authenticatedPage.getByText(/success|updated/i)).toBeVisible({ timeout: 10000 });
    
    // Verify loading state is gone
    await expect(submitButton).not.toBeDisabled();
  });
});
