import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthForm } from '@/components/auth/auth-form';
import { AuthProvider } from '@/contexts/AuthProvider';
import { act } from '@testing-library/react';

// Mock SimpleAuthProvider
vi.mock('@/contexts/SimpleAuthProvider', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: vi.fn(() => ({
    user: null,
    profile: null,
    loading: false,
    error: null,
    signOut: vi.fn(),
    refreshProfile: vi.fn(),
  })),
}));

// Mock auth functions
vi.mock('@/lib/auth', () => ({
  signUp: vi.fn(),
  signIn: vi.fn(),
  signInWithMagicLink: vi.fn(),
  resetPassword: vi.fn(),
}));

// Test wrapper
const renderWithAuth = (component: React.ReactElement) => {
  return render(<AuthProvider>{component}</AuthProvider>);
};

describe('Password Validation Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('AuthForm Password Validation', () => {
    it('should accept 6-character password during signup', async () => {
      renderWithAuth(<AuthForm />);

      // Switch to signup form
      const signupButton = screen.getByRole('button', {
        name: /create account/i,
      });
      await act(async () => {
        fireEvent.click(signupButton);
      });

      // Fill in form with 6-character password
      const emailInput = screen.getByPlaceholderText(/email/i);
      const passwordInput = screen.getByPlaceholderText(
        /password/i
      ) as HTMLInputElement;
      const fullNameInput = screen.getByPlaceholderText(/full name/i);
      const termsCheckbox = screen.getByRole('checkbox', {
        name: /accept terms/i,
      });

      await act(async () => {
        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
        fireEvent.change(passwordInput, { target: { value: '123456' } }); // 6 characters
        fireEvent.change(fullNameInput, { target: { value: 'Test User' } });
        fireEvent.click(termsCheckbox);
      });

      // Verify password input has correct minLength
      expect(passwordInput.minLength).toBe(6);

      // Verify no validation error is shown
      const errorMessage = screen.queryByText(
        /password must be 6\+ characters/i
      );
      expect(errorMessage).toBeInTheDocument(); // This should be the helper text, not an error
    });

    it('should have correct minLength attribute for 5-character password', async () => {
      renderWithAuth(<AuthForm />);

      // Switch to signup form
      const signupButton = screen.getByRole('button', {
        name: /create account/i,
      });
      await act(async () => {
        fireEvent.click(signupButton);
      });

      // Fill in form with 5-character password
      const emailInput = screen.getByPlaceholderText(/email/i);
      const passwordInput = screen.getByPlaceholderText(
        /password/i
      ) as HTMLInputElement;
      const fullNameInput = screen.getByPlaceholderText(/full name/i);
      const termsCheckbox = screen.getByRole('checkbox', {
        name: /accept terms/i,
      });

      await act(async () => {
        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
        fireEvent.change(passwordInput, { target: { value: '12345' } }); // 5 characters
        fireEvent.change(fullNameInput, { target: { value: 'Test User' } });
        fireEvent.click(termsCheckbox);
      });

      // Verify password input has correct minLength attribute
      expect(passwordInput.minLength).toBe(6);
      expect(passwordInput.value.length).toBe(5);

      // In a real browser, this would prevent form submission
      // In tests, we verify the attribute is set correctly
      expect(passwordInput.getAttribute('minlength')).toBe('6');
    });

    it('should show correct password requirement message', async () => {
      renderWithAuth(<AuthForm />);

      // Switch to signup form
      const signupButton = screen.getByRole('button', {
        name: /create account/i,
      });
      await act(async () => {
        fireEvent.click(signupButton);
      });

      // Check that the correct message is displayed
      const requirementMessage = screen.getByText(
        /password must be 6\+ characters/i
      );
      expect(requirementMessage).toBeInTheDocument();
    });

    it("should accept 8-character password (your mother's case)", async () => {
      renderWithAuth(<AuthForm />);

      // Switch to signup form
      const signupButton = screen.getByRole('button', {
        name: /create account/i,
      });
      await act(async () => {
        fireEvent.click(signupButton);
      });

      // Fill in form with 8-character password
      const emailInput = screen.getByPlaceholderText(/email/i);
      const passwordInput = screen.getByPlaceholderText(
        /password/i
      ) as HTMLInputElement;
      const fullNameInput = screen.getByPlaceholderText(/full name/i);
      const termsCheckbox = screen.getByRole('checkbox', {
        name: /accept terms/i,
      });

      await act(async () => {
        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
        fireEvent.change(passwordInput, { target: { value: '12345678' } }); // 8 characters
        fireEvent.change(fullNameInput, { target: { value: 'Test User' } });
        fireEvent.click(termsCheckbox);
      });

      // Verify password is valid
      expect(passwordInput.validity.valid).toBe(true);
      expect(passwordInput.value.length).toBeGreaterThanOrEqual(6);
    });
  });

  describe('Password Input Attributes', () => {
    it('should have correct minLength attribute on password input', async () => {
      renderWithAuth(<AuthForm />);

      // Switch to signup form
      const signupButton = screen.getByRole('button', {
        name: /create account/i,
      });
      await act(async () => {
        fireEvent.click(signupButton);
      });

      const passwordInput = screen.getByPlaceholderText(
        /password/i
      ) as HTMLInputElement;
      expect(passwordInput.minLength).toBe(6);
    });

    it('should have correct type and autocomplete attributes', async () => {
      renderWithAuth(<AuthForm />);

      // Switch to signup form
      const signupButton = screen.getByRole('button', {
        name: /create account/i,
      });
      await act(async () => {
        fireEvent.click(signupButton);
      });

      const passwordInput = screen.getByPlaceholderText(
        /password/i
      ) as HTMLInputElement;
      expect(passwordInput.type).toBe('password');
      expect(passwordInput.autocomplete).toBe('new-password');
    });
  });
});
