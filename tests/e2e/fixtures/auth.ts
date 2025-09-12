/* eslint-disable react-hooks/rules-of-hooks */
import { test as base, expect, Page } from '@playwright/test';
import { AuthPage } from '../utils/auth-page';

// Test user credentials for testing (using seeded user with recipes)
export const TEST_USER = {
  email: 'alice@example.com',
  password: 'Password123!',
  fullName: 'Alice Baker',
  username: 'alice',
};

// Extended test type with authentication fixtures
export type AuthFixtures = {
  authPage: AuthPage;
  authenticatedPage: Page;
};

export const test = base.extend<AuthFixtures>({
  // Auth page fixture
  authPage: async ({ page }, use) => {
    const authPage = new AuthPage(page);
    await use(authPage);
  },

  // Authenticated page fixture - automatically logs in before each test
  authenticatedPage: async ({ page, authPage }, use) => {
    // Navigate to sign in page
    await page.goto('/auth/signin');

    // Sign in with test credentials
    await authPage.signIn(TEST_USER.email, TEST_USER.password);

    // Wait for successful authentication and redirect
    await expect(page).toHaveURL('/recipes');

    // Pass the authenticated page to the test
    await use(page);
  },
});

export { expect } from '@playwright/test';
