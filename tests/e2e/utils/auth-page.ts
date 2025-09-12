import { Page, expect } from '@playwright/test';

export class AuthPage {
  constructor(private page: Page) {}

  // Selectors
  private emailInput = () => this.page.getByRole('textbox', { name: 'Email' });
  private passwordInput = () =>
    this.page.getByRole('textbox', { name: 'Password' });
  private signInButton = () =>
    this.page.getByRole('button', { name: 'Sign In' });
  private createAccountButton = () =>
    this.page.getByRole('button', { name: 'Create account' });
  private magicLinkButton = () =>
    this.page.getByRole('button', { name: 'Magic link' });
  private resetPasswordButton = () =>
    this.page.getByRole('button', { name: 'Reset password' });

  // Navigation methods
  async gotoSignIn() {
    await this.page.goto('/auth/signin');
    await expect(this.page).toHaveURL('/auth/signin');
  }

  async gotoSignUp() {
    await this.page.goto('/auth/signup');
    await expect(this.page).toHaveURL('/auth/signup');
  }

  // Authentication methods
  async signIn(email: string, password: string) {
    await this.emailInput().fill(email);
    await this.passwordInput().fill(password);
    await this.signInButton().click();
  }

  async signUp(email: string, password: string, fullName?: string) {
    if (fullName) {
      const nameInput = this.page.getByRole('textbox', { name: 'Full Name' });
      await nameInput.fill(fullName);
    }
    await this.emailInput().fill(email);
    await this.passwordInput().fill(password);
    await this.createAccountButton().click();
  }

  async requestMagicLink(email: string) {
    await this.emailInput().fill(email);
    await this.magicLinkButton().click();
  }

  async resetPassword(email: string) {
    await this.emailInput().fill(email);
    await this.resetPasswordButton().click();
  }

  // Validation methods
  async expectSignInForm() {
    await expect(this.emailInput()).toBeVisible();
    await expect(this.passwordInput()).toBeVisible();
    await expect(this.signInButton()).toBeVisible();
  }

  async expectSignUpForm() {
    await expect(this.emailInput()).toBeVisible();
    await expect(this.passwordInput()).toBeVisible();
    await expect(this.createAccountButton()).toBeVisible();
  }

  async expectAuthenticationSuccess() {
    // Wait for redirect to authenticated area
    await expect(this.page).toHaveURL('/recipes');
  }

  async expectAuthenticationError(message?: string) {
    // Look for error message or validation feedback
    if (message) {
      await expect(this.page.getByText(message)).toBeVisible();
    } else {
      // Generic error state - form should still be visible
      await expect(this.emailInput()).toBeVisible();
    }
  }

  // Utility methods
  async clearForm() {
    await this.emailInput().clear();
    await this.passwordInput().clear();
  }

  async isSignedIn(): Promise<boolean> {
    try {
      // Check if we're on an authenticated page
      await this.page.waitForURL('/recipes', { timeout: 1000 });
      return true;
    } catch {
      return false;
    }
  }
}
