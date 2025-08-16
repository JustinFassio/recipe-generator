/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AuthForm } from '@/components/auth/auth-form';

// Mock the supabase client
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        not: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
          })),
        })),
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
      render(<AuthForm />);
      expect(screen.getByText("Mom's Recipe Generator")).toBeInTheDocument();
    });

    it('should render sign in form by default', () => {
      render(<AuthForm />);

      expect(
        screen.getByRole('heading', { name: /sign in/i })
      ).toBeInTheDocument();
      expect(
        screen.getByText('Welcome back to your digital cookbook')
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /sign in/i })
      ).toBeInTheDocument();
    });

    it('should render link for switching to sign up', () => {
      render(<AuthForm />);

      const signUpLink = screen.getByRole('link', { name: /or sign up/i });
      expect(signUpLink).toBeInTheDocument();
    });

    it('should render the recipe showcase section', () => {
      render(<AuthForm />);

      expect(screen.getByText('Discover Amazing Recipes')).toBeInTheDocument();
      expect(
        screen.getByText('Join our community of passionate home chefs')
      ).toBeInTheDocument();
    });
  });

  describe('Form Switching', () => {
    it('should switch to sign up form when link is clicked', () => {
      render(<AuthForm />);

      // Click the sign up link
      const signUpLink = screen.getByRole('link', { name: /or sign up/i });
      fireEvent.click(signUpLink);

      // Check that sign up form is now visible
      expect(screen.getByText('Create new account')).toBeInTheDocument();
      expect(
        screen.getByText('Registration is free and only takes a minute')
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /accept terms to continue/i })
      ).toBeInTheDocument();
    });

    it('should switch back to sign in form when link is clicked', () => {
      render(<AuthForm />);

      // First switch to sign up
      const signUpLink = screen.getByRole('link', { name: /or sign up/i });
      fireEvent.click(signUpLink);

      // Then switch back to sign in
      const signInLink = screen.getByRole('link', { name: /or sign in/i });
      fireEvent.click(signInLink);

      // Check that sign in form is now visible
      expect(
        screen.getByRole('heading', { name: /sign in/i })
      ).toBeInTheDocument();
      expect(
        screen.getByText('Welcome back to your digital cookbook')
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /sign in/i })
      ).toBeInTheDocument();
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

      // Switch to sign up form using the link
      const signUpLink = screen.getByRole('link', { name: /or sign up/i });
      fireEvent.click(signUpLink);

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
