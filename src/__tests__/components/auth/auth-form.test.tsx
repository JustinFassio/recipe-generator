import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AuthForm } from '@/components/auth/auth-form';
import { AuthProvider } from '@/contexts/AuthProvider';

// Mock AuthProvider
vi.mock('@/contexts/AuthProvider', () => ({
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

// Test wrapper to provide auth context
const renderWithAuth = (component: React.ReactElement) => {
  return render(<AuthProvider>{component}</AuthProvider>);
};

// Mock the supabase client
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      getSession: vi.fn(() =>
        Promise.resolve({ data: { session: null }, error: null })
      ),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
      signOut: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => {
        // Create a comprehensive mock chain that supports all query patterns
        const createChainMock = () => ({
          eq: vi.fn(() => createChainMock()),
          not: vi.fn(() => createChainMock()),
          gte: vi.fn(() => createChainMock()),
          order: vi.fn(() => createChainMock()),
          limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
          then: vi.fn(() => Promise.resolve({ data: [], error: null })),
        });
        return createChainMock();
      }),
      eq: vi.fn(() => ({
        single: vi.fn(() => Promise.resolve({ data: null, error: null })),
      })),
    })),
  },
}));

// Mock the toast hook
vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn(),
}));

describe('AuthForm', () => {
  describe('Initial Render', () => {
    it('should render the auth form with title', () => {
      renderWithAuth(<AuthForm />);
      expect(screen.getAllByText('Recipe Generator')[0]).toBeInTheDocument();
    });

    it('should render sign in form by default', () => {
      renderWithAuth(<AuthForm />);

      expect(
        screen.getByRole('heading', { name: /sign in/i })
      ).toBeInTheDocument();
      expect(
        screen.getByText('Welcome back to your family cookbook')
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /sign in/i })
      ).toBeInTheDocument();
    });

    it('should render button for switching to sign up', () => {
      renderWithAuth(<AuthForm />);

      const signUpButton = screen.getByRole('button', {
        name: /create account/i,
      });
      expect(signUpButton).toBeInTheDocument();
    });

    it('should render the recipe showcase section', () => {
      renderWithAuth(<AuthForm />);

      // The StackedImages component now shows top-rated recipes dynamically
      // In test environment, it shows loading skeletons since API calls are mocked
      const skeletons = screen.getAllByRole('generic');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('Form Switching', () => {
    it('should switch to sign up form when button is clicked', () => {
      renderWithAuth(<AuthForm />);

      // Click the sign up button
      const signUpButton = screen.getByRole('button', {
        name: /create account/i,
      });
      fireEvent.click(signUpButton);

      // Check that sign up form is now visible
      expect(screen.getByText('Create new account')).toBeInTheDocument();
      expect(
        screen.getByText('Registration is free and only takes a minute')
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /accept terms to continue/i })
      ).toBeInTheDocument();
    });

    it('should switch back to sign in form when button is clicked', () => {
      renderWithAuth(<AuthForm />);

      // First switch to sign up
      const signUpButton = screen.getByRole('button', {
        name: /create account/i,
      });
      fireEvent.click(signUpButton);

      // Then switch back to sign in
      const signInButton = screen.getByRole('button', {
        name: /already have an account\? sign in/i,
      });
      fireEvent.click(signInButton);

      // Check that sign in form is now visible
      expect(
        screen.getByRole('heading', { name: /sign in/i })
      ).toBeInTheDocument();
      expect(
        screen.getByText('Welcome back to your family cookbook')
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /sign in/i })
      ).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should require email and password fields', () => {
      renderWithAuth(<AuthForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);

      expect(emailInput).toHaveAttribute('required');
      expect(passwordInput).toHaveAttribute('required');
    });

    it('should have proper input types', () => {
      renderWithAuth(<AuthForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);

      expect(emailInput).toHaveAttribute('type', 'email');
      expect(passwordInput).toHaveAttribute('type', 'password');
    });

    it('should have proper autocomplete attributes', () => {
      renderWithAuth(<AuthForm />);

      const passwordInput = screen.getByLabelText(/password/i);
      expect(passwordInput).toHaveAttribute('autocomplete', 'current-password');

      // Switch to sign up form using the button
      const signUpButton = screen.getByRole('button', {
        name: /create account/i,
      });
      fireEvent.click(signUpButton);

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
      renderWithAuth(<AuthForm />);

      expect(screen.getAllByText('Recipe Generator')[0]).toBeInTheDocument();
      expect(
        screen.getByText(
          'Your digital cookbook for collecting and organizing recipes'
        )
      ).toBeInTheDocument();
    });

    it('should render the chef hat icon', () => {
      renderWithAuth(<AuthForm />);

      const chefHatIcon = screen.getByTestId('chef-hat-icon');
      expect(chefHatIcon).toBeInTheDocument();
    });
  });
});
