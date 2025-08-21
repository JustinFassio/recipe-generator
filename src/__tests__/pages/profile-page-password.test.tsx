import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ProfilePage from '@/pages/profile-page';

// Mock auth functions
vi.mock('@/lib/auth', () => ({
  updateProfile: vi.fn(() => Promise.resolve({ success: true, error: null })),
  updateEmail: vi.fn(() => Promise.resolve({ success: true, error: null })),
  updatePassword: vi.fn(() => Promise.resolve({ success: true, error: null })),
  claimUsername: vi.fn(() => Promise.resolve({ success: true, error: null })),
  checkUsernameAvailability: vi.fn(() =>
    Promise.resolve({ available: true, error: null })
  ),
  uploadAvatar: vi.fn(() => Promise.resolve({ success: true, error: null })),
}));

// Mock toast
vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn(),
  useToast: vi.fn(() => ({
    toast: vi.fn(),
    dismiss: vi.fn(),
    toasts: [],
  })),
}));

const switchToAccountTab = () => {
  const accountTab = screen.getByRole('button', { name: /account/i });
  fireEvent.click(accountTab);
};

describe('Profile Page Password Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Password Change Form', () => {
    it('should accept 6-character password', () => {
      render(<ProfilePage />);

      switchToAccountTab();

      const newPasswordInput = screen.getByPlaceholderText(
        /enter new password/i
      ) as HTMLInputElement;
      const confirmPasswordInput = screen.getByPlaceholderText(
        /confirm new password/i
      ) as HTMLInputElement;

      expect(newPasswordInput.minLength).toBe(6);
      expect(confirmPasswordInput.minLength).toBe(6);

      fireEvent.change(newPasswordInput, { target: { value: '123456' } });
      fireEvent.change(confirmPasswordInput, { target: { value: '123456' } });

      expect(newPasswordInput.validity.valid).toBe(true);
      expect(confirmPasswordInput.validity.valid).toBe(true);
    });

    it('should have correct minLength attribute for 5-character password', () => {
      render(<ProfilePage />);

      switchToAccountTab();

      const newPasswordInput = screen.getByPlaceholderText(
        /enter new password/i
      ) as HTMLInputElement;
      const confirmPasswordInput = screen.getByPlaceholderText(
        /confirm new password/i
      ) as HTMLInputElement;

      fireEvent.change(newPasswordInput, { target: { value: '12345' } });
      fireEvent.change(confirmPasswordInput, { target: { value: '12345' } });

      expect(newPasswordInput.minLength).toBe(6);
      expect(confirmPasswordInput.minLength).toBe(6);
      expect(newPasswordInput.getAttribute('minlength')).toBe('6');
      expect(confirmPasswordInput.getAttribute('minlength')).toBe('6');
      expect(newPasswordInput.value.length).toBe(5);
      expect(confirmPasswordInput.value.length).toBe(5);
    });

    it('should show correct password requirement message', () => {
      render(<ProfilePage />);

      switchToAccountTab();

      expect(
        screen.getByText(/password must be at least 6 characters long/i)
      ).toBeInTheDocument();
    });

    it("should accept 8-character password (your mother's case)", () => {
      render(<ProfilePage />);

      switchToAccountTab();

      const newPasswordInput = screen.getByPlaceholderText(
        /enter new password/i
      ) as HTMLInputElement;
      const confirmPasswordInput = screen.getByPlaceholderText(
        /confirm new password/i
      ) as HTMLInputElement;

      fireEvent.change(newPasswordInput, { target: { value: '12345678' } });
      fireEvent.change(confirmPasswordInput, { target: { value: '12345678' } });

      expect(newPasswordInput.validity.valid).toBe(true);
      expect(confirmPasswordInput.validity.valid).toBe(true);
      expect(newPasswordInput.value.length).toBeGreaterThanOrEqual(6);
    });

    it('should enable submit button with valid 6-character password', () => {
      render(<ProfilePage />);

      switchToAccountTab();

      const newPasswordInput =
        screen.getByPlaceholderText(/enter new password/i);
      const confirmPasswordInput =
        screen.getByPlaceholderText(/confirm new password/i);
      const submitButton = screen.getByRole('button', {
        name: /update password/i,
      });

      expect(submitButton).toBeDisabled();

      fireEvent.change(newPasswordInput, { target: { value: '123456' } });
      fireEvent.change(confirmPasswordInput, { target: { value: '123456' } });

      expect(submitButton).not.toBeDisabled();
    });
  });

  describe('Password Input Attributes', () => {
    it('should have correct type and placeholder attributes', () => {
      render(<ProfilePage />);

      switchToAccountTab();

      const newPasswordInput = screen.getByPlaceholderText(
        /enter new password/i
      ) as HTMLInputElement;
      const confirmPasswordInput = screen.getByPlaceholderText(
        /confirm new password/i
      ) as HTMLInputElement;

      expect(newPasswordInput.type).toBe('password');
      expect(confirmPasswordInput.type).toBe('password');
      expect(newPasswordInput.placeholder).toBe('Enter new password');
      expect(confirmPasswordInput.placeholder).toBe('Confirm new password');
    });
  });
});
