import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ProfilePage from '@/pages/profile-page';
import { AuthProvider } from '@/contexts/AuthProvider';
import { act } from '@testing-library/react';

// Mock SimpleAuthProvider
vi.mock('@/contexts/SimpleAuthProvider', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: vi.fn(() => ({
    user: { id: 'test-user-id', email: 'test@example.com' },
    profile: {
      id: 'test-user-id',
      username: 'testuser',
      full_name: 'Test User',
      avatar_url: null,
    },
    loading: false,
    error: null,
    signOut: vi.fn(),
    refreshProfile: vi.fn(),
  })),
}));

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
}));

// Test wrapper
const renderWithAuth = (component: React.ReactElement) => {
  return render(<AuthProvider>{component}</AuthProvider>);
};

describe('Profile Page Password Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Password Change Form', () => {
    it('should accept 6-character password', async () => {
      renderWithAuth(<ProfilePage />);

      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByText('Account Settings')).toBeInTheDocument();
      });

      // Switch to account tab
      const accountTab = screen.getByText('Account');
      await act(async () => {
        fireEvent.click(accountTab);
      });

      // Find password inputs
      const newPasswordInput = screen.getByPlaceholderText(
        /enter new password/i
      ) as HTMLInputElement;
      const confirmPasswordInput = screen.getByPlaceholderText(
        /confirm new password/i
      ) as HTMLInputElement;

      // Verify minLength attributes
      expect(newPasswordInput.minLength).toBe(6);
      expect(confirmPasswordInput.minLength).toBe(6);

      // Enter 6-character password
      await act(async () => {
        fireEvent.change(newPasswordInput, { target: { value: '123456' } });
        fireEvent.change(confirmPasswordInput, { target: { value: '123456' } });
      });

      // Verify inputs are valid
      expect(newPasswordInput.validity.valid).toBe(true);
      expect(confirmPasswordInput.validity.valid).toBe(true);
    });

    it('should have correct minLength attribute for 5-character password', async () => {
      renderWithAuth(<ProfilePage />);

      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByText('Account Settings')).toBeInTheDocument();
      });

      // Switch to account tab
      const accountTab = screen.getByText('Account');
      await act(async () => {
        fireEvent.click(accountTab);
      });

      // Find password inputs
      const newPasswordInput = screen.getByPlaceholderText(
        /enter new password/i
      ) as HTMLInputElement;
      const confirmPasswordInput = screen.getByPlaceholderText(
        /confirm new password/i
      ) as HTMLInputElement;

      // Enter 5-character password
      await act(async () => {
        fireEvent.change(newPasswordInput, { target: { value: '12345' } });
        fireEvent.change(confirmPasswordInput, { target: { value: '12345' } });
      });

      // Verify inputs have correct minLength attributes
      expect(newPasswordInput.minLength).toBe(6);
      expect(confirmPasswordInput.minLength).toBe(6);
      expect(newPasswordInput.getAttribute('minlength')).toBe('6');
      expect(confirmPasswordInput.getAttribute('minlength')).toBe('6');

      // Verify the values are what we expect
      expect(newPasswordInput.value.length).toBe(5);
      expect(confirmPasswordInput.value.length).toBe(5);
    });

    it('should show correct password requirement message', async () => {
      renderWithAuth(<ProfilePage />);

      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByText('Account Settings')).toBeInTheDocument();
      });

      // Switch to account tab
      const accountTab = screen.getByText('Account');
      await act(async () => {
        fireEvent.click(accountTab);
      });

      // Check that the correct message is displayed
      const requirementMessage = screen.getByText(
        /password must be at least 6 characters long/i
      );
      expect(requirementMessage).toBeInTheDocument();
    });

    it("should accept 8-character password (your mother's case)", async () => {
      renderWithAuth(<ProfilePage />);

      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByText('Account Settings')).toBeInTheDocument();
      });

      // Switch to account tab
      const accountTab = screen.getByText('Account');
      await act(async () => {
        fireEvent.click(accountTab);
      });

      // Find password inputs
      const newPasswordInput = screen.getByPlaceholderText(
        /enter new password/i
      ) as HTMLInputElement;
      const confirmPasswordInput = screen.getByPlaceholderText(
        /confirm new password/i
      ) as HTMLInputElement;

      // Enter 8-character password
      await act(async () => {
        fireEvent.change(newPasswordInput, { target: { value: '12345678' } });
        fireEvent.change(confirmPasswordInput, {
          target: { value: '12345678' },
        });
      });

      // Verify inputs are valid
      expect(newPasswordInput.validity.valid).toBe(true);
      expect(confirmPasswordInput.validity.valid).toBe(true);
      expect(newPasswordInput.value.length).toBeGreaterThanOrEqual(6);
    });

    it('should enable submit button with valid 6-character password', async () => {
      renderWithAuth(<ProfilePage />);

      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByText('Account Settings')).toBeInTheDocument();
      });

      // Switch to account tab
      const accountTab = screen.getByText('Account');
      await act(async () => {
        fireEvent.click(accountTab);
      });

      // Find password inputs and submit button
      const newPasswordInput =
        screen.getByPlaceholderText(/enter new password/i);
      const confirmPasswordInput =
        screen.getByPlaceholderText(/confirm new password/i);
      const submitButton = screen.getByRole('button', {
        name: /update password/i,
      });

      // Initially button should be disabled
      expect(submitButton).toBeDisabled();

      // Enter valid 6-character password
      await act(async () => {
        fireEvent.change(newPasswordInput, { target: { value: '123456' } });
        fireEvent.change(confirmPasswordInput, { target: { value: '123456' } });
      });

      // Button should now be enabled
      expect(submitButton).not.toBeDisabled();
    });
  });

  describe('Password Input Attributes', () => {
    it('should have correct type and placeholder attributes', async () => {
      renderWithAuth(<ProfilePage />);

      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByText('Account Settings')).toBeInTheDocument();
      });

      // Switch to account tab
      const accountTab = screen.getByText('Account');
      await act(async () => {
        fireEvent.click(accountTab);
      });

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
