import { Page } from '@playwright/test';

/**
 * Test user setup utilities for Playwright tests
 * This handles creating and managing test users for E2E testing
 */

export interface TestUser {
  email: string;
  password: string;
  fullName: string;
  username: string;
}

export const TEST_USERS = {
  // Primary test user (Alice from seed script)
  primary: {
    email: 'alice@example.com',
    password: 'Password123!',
    fullName: 'Alice Baker',
    username: 'alice',
  },

  // Secondary test user (Bob from seed script)
  secondary: {
    email: 'bob@example.com',
    password: 'Password123!',
    fullName: 'Bob Chef',
    username: 'bob',
  },

  // Third test user (Charlie from seed script)
  admin: {
    email: 'charlie@example.com',
    password: 'Password123!',
    fullName: 'Charlie Cook',
    username: 'charlie',
  },
} as const;

/**
 * Creates a test user in the database
 * This should be called in test setup or beforeEach hooks
 */
export async function createTestUser(
  page: Page,
  user: TestUser
): Promise<void> {
  // Navigate to sign up page
  await page.goto('/auth/signup');

  // Fill out the sign up form
  await page.getByRole('textbox', { name: 'Full Name' }).fill(user.fullName);
  await page.getByRole('textbox', { name: 'Email' }).fill(user.email);
  await page.getByRole('textbox', { name: 'Password' }).fill(user.password);

  // Submit the form
  await page.getByRole('button', { name: 'Create account' }).click();

  // Wait for successful sign up and redirect
  await page.waitForURL('/recipes');
}

/**
 * Signs in a test user
 */
export async function signInTestUser(
  page: Page,
  user: TestUser
): Promise<void> {
  await page.goto('/auth/signin');

  await page.getByRole('textbox', { name: 'Email' }).fill(user.email);
  await page.getByRole('textbox', { name: 'Password' }).fill(user.password);
  await page.getByRole('button', { name: 'Sign In' }).click();

  // Wait for successful sign in and redirect
  await page.waitForURL('/recipes');
}

/**
 * Signs out the current user
 */
export async function signOutUser(page: Page): Promise<void> {
  // Look for sign out button (this might be in a dropdown menu)
  // Adjust selector based on your actual UI
  const signOutButton = page.getByRole('button', { name: /sign out|logout/i });
  await signOutButton.click();

  // Wait for redirect to sign in page
  await page.waitForURL('/auth/signin');
}

/**
 * Checks if a user is currently signed in
 */
export async function isUserSignedIn(page: Page): Promise<boolean> {
  try {
    // Check if we're on an authenticated page
    await page.waitForURL('/recipes', { timeout: 1000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Sets up a test user session by creating the user if needed
 * This is useful for tests that need a guaranteed authenticated state
 */
export async function ensureTestUserExists(
  page: Page,
  user: TestUser
): Promise<void> {
  // Try to sign in first
  await page.goto('/auth/signin');
  await page.getByRole('textbox', { name: 'Email' }).fill(user.email);
  await page.getByRole('textbox', { name: 'Password' }).fill(user.password);
  await page.getByRole('button', { name: 'Sign In' }).click();

  // If sign in fails, create the user
  try {
    await page.waitForURL('/recipes', { timeout: 5000 });
  } catch {
    // Sign in failed, create the user
    await createTestUser(page, user);
  }
}
