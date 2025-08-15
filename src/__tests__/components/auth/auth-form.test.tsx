/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthForm } from '@/components/auth/auth-form';
import { supabase } from '@/lib/supabase';

// Mock the supabase client
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
    },
  },
}));

// Mock the toast hook
vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn(),
}));

describe('AuthForm', () => {
  const mockSupabase = vi.mocked(supabase);

  beforeEach(() => {
    vi.clearAllMocks();
    // Set up default mock return values
    vi.mocked(mockSupabase.auth.signInWithPassword).mockResolvedValue({
      data: { user: null, session: null },
      error: null,
    } as any);
    vi.mocked(mockSupabase.auth.signUp).mockResolvedValue({
      data: { user: null, session: null },
      error: null,
    } as any);
  });

  describe('Tab Functionality', () => {
    it('should render sign in tab by default', () => {
      render(<AuthForm />);

      // Check that sign in tab is active
      const signInTab = screen.getByRole('tab', { name: /sign in/i });
      const signUpTab = screen.getByRole('tab', { name: /sign up/i });

      expect(signInTab).toHaveClass('tab-active');
      expect(signUpTab).not.toHaveClass('tab-active');

      // Check that sign in form is visible
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /sign in/i })
      ).toBeInTheDocument();
    });

    it('should switch to sign up tab when clicked', () => {
      render(<AuthForm />);

      const signUpTab = screen.getByRole('tab', { name: /sign up/i });
      fireEvent.click(signUpTab);

      // Check that sign up tab is now active
      expect(signUpTab).toHaveClass('tab-active');

      // Check that sign up form is visible
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /sign up/i })
      ).toBeInTheDocument();
    });

    it('should switch back to sign in tab when clicked', () => {
      render(<AuthForm />);

      // First switch to sign up
      const signUpTab = screen.getByRole('tab', { name: /sign up/i });
      fireEvent.click(signUpTab);

      // Then switch back to sign in
      const signInTab = screen.getByRole('tab', { name: /sign in/i });
      fireEvent.click(signInTab);

      // Check that sign in tab is active
      expect(signInTab).toHaveClass('tab-active');
      expect(signUpTab).not.toHaveClass('tab-active');
    });

    it('should have proper tab structure with role attributes', () => {
      render(<AuthForm />);

      // Check that tabs container has proper role
      const tabsContainer = screen.getByRole('tablist');
      expect(tabsContainer).toBeInTheDocument();

      // Check that individual tabs have proper roles
      const signInTab = screen.getByRole('tab', { name: /sign in/i });
      const signUpTab = screen.getByRole('tab', { name: /sign up/i });

      expect(signInTab).toBeInTheDocument();
      expect(signUpTab).toBeInTheDocument();
    });
  });

  describe('Sign In Functionality', () => {
    it('should handle sign in form submission', async () => {
      render(<AuthForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const signInButton = screen.getByRole('button', { name: /sign in/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(signInButton);

      await waitFor(() => {
        expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
        });
      });
    });

    it('should show loading state during sign in', async () => {
      vi.mocked(mockSupabase.auth.signInWithPassword).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  data: { user: null, session: null },
                  error: null,
                } as any),
              100
            )
          )
      );

      render(<AuthForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const signInButton = screen.getByRole('button', { name: /sign in/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(signInButton);

      // Check loading state
      expect(
        screen.getByRole('button', { name: /signing in/i })
      ).toBeInTheDocument();
      expect(signInButton).toBeDisabled();

      // Wait for the promise to resolve
      await waitFor(() => {
        expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalled();
      });
    });
  });

  describe('Sign Up Functionality', () => {
    it('should handle sign up form submission', async () => {
      render(<AuthForm />);

      // Switch to sign up tab
      const signUpTab = screen.getByRole('tab', { name: /sign up/i });
      fireEvent.click(signUpTab);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const signUpButton = screen.getByRole('button', { name: /sign up/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(signUpButton);

      await waitFor(() => {
        expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
        });
      });
    });

    it('should show loading state during sign up', async () => {
      vi.mocked(mockSupabase.auth.signUp).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  data: { user: null, session: null },
                  error: null,
                } as any),
              100
            )
          )
      );

      render(<AuthForm />);

      // Switch to sign up tab
      const signUpTab = screen.getByRole('tab', { name: /sign up/i });
      fireEvent.click(signUpTab);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const signUpButton = screen.getByRole('button', { name: /sign up/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(signUpButton);

      // Check loading state
      expect(
        screen.getByRole('button', { name: /creating account/i })
      ).toBeInTheDocument();
      expect(signUpButton).toBeDisabled();

      // Wait for the promise to resolve
      await waitFor(() => {
        expect(mockSupabase.auth.signUp).toHaveBeenCalled();
      });
    });

    it('should have different form IDs for sign up vs sign in', () => {
      render(<AuthForm />);

      // Check sign in form IDs
      expect(screen.getByLabelText(/email/i)).toHaveAttribute('id', 'email');
      expect(screen.getByLabelText(/password/i)).toHaveAttribute(
        'id',
        'password'
      );

      // Switch to sign up tab
      const signUpTab = screen.getByRole('tab', { name: /sign up/i });
      fireEvent.click(signUpTab);

      // Check sign up form IDs (should be different)
      expect(screen.getByLabelText(/email/i)).toHaveAttribute(
        'id',
        'signup-email'
      );
      expect(screen.getByLabelText(/password/i)).toHaveAttribute(
        'id',
        'signup-password'
      );
    });
  });

  describe('Form Validation', () => {
    it('should require email and password fields', () => {
      render(<AuthForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);

      expect(emailInput).toHaveAttribute('required');
      expect(passwordInput).toHaveAttribute('required');
    });

    it('should have proper input types', () => {
      render(<AuthForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);

      expect(emailInput).toHaveAttribute('type', 'email');
      expect(passwordInput).toHaveAttribute('type', 'password');
    });

    it('should have proper autocomplete attributes', () => {
      render(<AuthForm />);

      const passwordInput = screen.getByLabelText(/password/i);
      expect(passwordInput).toHaveAttribute('autocomplete', 'current-password');

      // Switch to sign up tab
      const signUpTab = screen.getByRole('tab', { name: /sign up/i });
      fireEvent.click(signUpTab);

      const signUpPasswordInput = screen
        .getAllByLabelText(/password/i)
        .find((input) => input.id === 'signup-password');
      expect(signUpPasswordInput).toHaveAttribute(
        'autocomplete',
        'new-password'
      );
    });
  });

  describe('UI Elements', () => {
    it('should render the app title and description', () => {
      render(<AuthForm />);

      expect(screen.getByText('Recipe Generator')).toBeInTheDocument();
      expect(
        screen.getByText(
          'Your digital cookbook for collecting and organizing recipes'
        )
      ).toBeInTheDocument();
    });

    it('should render the chef hat icon', () => {
      render(<AuthForm />);

      const chefHatIcon = screen.getByTestId('chef-hat-icon');
      expect(chefHatIcon).toBeInTheDocument();
    });
  });
});
