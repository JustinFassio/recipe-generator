import { test, expect } from './fixtures/auth';
import { TEST_USERS } from './utils/test-user-setup';

test.describe('Authentication', () => {
  test.describe('Sign In Flow', () => {
    test('should display sign in form correctly', async ({ authPage }) => {
      await authPage.gotoSignIn();
      await authPage.expectSignInForm();
    });

    test('should sign in with valid credentials', async ({ authPage }) => {
      await authPage.gotoSignIn();
      await authPage.signIn(
        TEST_USERS.primary.email,
        TEST_USERS.primary.password
      );
      await authPage.expectAuthenticationSuccess();
    });

    test('should show error for invalid credentials', async ({ authPage }) => {
      await authPage.gotoSignIn();
      await authPage.signIn('invalid@example.com', 'wrongpassword');
      await authPage.expectAuthenticationError();
    });

    test('should show error for empty credentials', async ({ authPage }) => {
      await authPage.gotoSignIn();
      await authPage.signIn('', '');
      // Form validation should prevent submission or show error
      await expect(
        authPage.page.getByRole('button', { name: 'Sign In' })
      ).toBeDisabled();
    });
  });

  test.describe('Sign Up Flow', () => {
    test('should display sign up form correctly', async ({ authPage }) => {
      await authPage.gotoSignUp();
      await authPage.expectSignUpForm();
    });

    test('should create account with valid information', async ({
      authPage,
    }) => {
      const testEmail = `test-${Date.now()}@example.com`;
      const testUser = {
        email: testEmail,
        password: 'testpassword123',
        fullName: 'New Test User',
      };

      await authPage.gotoSignUp();
      await authPage.signUp(
        testUser.email,
        testUser.password,
        testUser.fullName
      );
      await authPage.expectAuthenticationSuccess();
    });

    test('should show error for existing email', async ({ authPage }) => {
      await authPage.gotoSignUp();
      await authPage.signUp(
        TEST_USERS.primary.email,
        'password123',
        'Test User'
      );
      await authPage.expectAuthenticationError();
    });
  });

  test.describe('Navigation', () => {
    test('should redirect unauthenticated users to sign in', async ({
      page,
    }) => {
      await page.goto('/recipes');
      await expect(page).toHaveURL('/auth/signin');
    });

    test('should allow access to public pages without authentication', async ({
      page,
    }) => {
      // Assuming you have public pages like landing page, about, etc.
      await page.goto('/');
      // Should not redirect to sign in
      await expect(page).not.toHaveURL('/auth/signin');
    });
  });

  test.describe('Authenticated User Experience', () => {
    test('should access protected routes after sign in', async ({
      authenticatedPage,
    }) => {
      // This test uses the authenticatedPage fixture which automatically signs in
      await expect(authenticatedPage).toHaveURL('/recipes');

      // Test navigation to other protected routes
      await authenticatedPage.goto('/profile');
      await expect(authenticatedPage).toHaveURL('/profile');
    });

    test('should maintain session across page refreshes', async ({
      authenticatedPage,
    }) => {
      await authenticatedPage.reload();
      await expect(authenticatedPage).toHaveURL('/recipes');
    });
  });

  test.describe('Password Reset', () => {
    test('should request password reset', async ({ authPage }) => {
      await authPage.gotoSignIn();
      await authPage.resetPassword(TEST_USERS.primary.email);
      // Should show success message or redirect
      await expect(authPage.page.getByText(/reset|sent/i)).toBeVisible();
    });
  });

  test.describe('Magic Link', () => {
    test('should request magic link', async ({ authPage }) => {
      await authPage.gotoSignIn();
      await authPage.requestMagicLink(TEST_USERS.primary.email);
      // Should show success message or redirect
      await expect(authPage.page.getByText(/link|sent/i)).toBeVisible();
    });
  });
});
