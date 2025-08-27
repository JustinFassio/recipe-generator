import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthProvider';
import ProfilePage from '@/pages/profile-page';

// Mock Supabase for E2E testing
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
      onAuthStateChange: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
      upsert: vi.fn(),
      update: vi.fn(),
    })),
    rpc: vi.fn(),
  },
}));

// Mock the auth functions
vi.mock('@/lib/auth', () => ({
  checkUsernameAvailability: vi.fn(),
  claimUsername: vi.fn(),
}));

import { supabase } from '@/lib/supabase';
import { checkUsernameAvailability, claimUsername } from '@/lib/auth';

const mockSupabase = vi.mocked(supabase);
const mockCheckUsernameAvailability = vi.mocked(checkUsernameAvailability);
const mockClaimUsername = vi.mocked(claimUsername);

describe('Username Workflow E2E', () => {
  let queryClient: QueryClient;

  beforeAll(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock authenticated user
    mockSupabase.auth.getUser.mockResolvedValue({
      data: {
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
        },
      },
      error: null,
    });

    // Mock profile data
    mockSupabase
      .from()
      .select()
      .eq()
      .single.mockResolvedValue({
        data: {
          id: 'test-user-id',
          username: 'currentuser',
          full_name: 'Test User',
          avatar_url: null,
          bio: null,
          region: null,
          language: 'en',
          units: 'metric',
          time_per_meal: null,
          skill_level: 'beginner',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        error: null,
      });

    // Mock empty safety and cooking preferences
    mockSupabase.from().select().eq().maybeSingle.mockResolvedValue({
      data: null,
      error: null,
    });
  });

  const renderProfilePage = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <ProfilePage />
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    );
  };

  describe('Username Display and Editing', () => {
    it('should display current username in disabled field', async () => {
      renderProfilePage();

      await waitFor(() => {
        expect(screen.getByDisplayValue('currentuser')).toBeInTheDocument();
      });

      const currentUsernameField = screen.getByDisplayValue('currentuser');
      expect(currentUsernameField).toBeDisabled();
      expect(screen.getByText('Change Username')).toBeInTheDocument();
    });

    it('should show claim username field when no current username', async () => {
      // Mock user without username
      mockSupabase
        .from()
        .select()
        .eq()
        .single.mockResolvedValue({
          data: {
            id: 'test-user-id',
            username: null,
            full_name: 'Test User',
            // ... other fields
          },
          error: null,
        });

      renderProfilePage();

      await waitFor(() => {
        expect(screen.queryByText('Current Username')).not.toBeInTheDocument();
        expect(screen.getByText('Claim Username')).toBeInTheDocument();
      });
    });
  });

  describe('Username Availability Checking', () => {
    it('should check username availability when typing', async () => {
      mockCheckUsernameAvailability.mockResolvedValue({
        available: true,
      });

      renderProfilePage();

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText('Choose a unique username')
        ).toBeInTheDocument();
      });

      const usernameInput = screen.getByPlaceholderText(
        'Choose a unique username'
      );

      fireEvent.change(usernameInput, { target: { value: 'newusername' } });

      // Wait for debounced check
      await waitFor(
        () => {
          expect(mockCheckUsernameAvailability).toHaveBeenCalledWith(
            'newusername'
          );
        },
        { timeout: 1000 }
      );
    });

    it('should show available state when username is available', async () => {
      mockCheckUsernameAvailability.mockResolvedValue({
        available: true,
      });

      renderProfilePage();

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText('Choose a unique username')
        ).toBeInTheDocument();
      });

      const usernameInput = screen.getByPlaceholderText(
        'Choose a unique username'
      );

      fireEvent.change(usernameInput, { target: { value: 'availableuser' } });

      await waitFor(
        () => {
          expect(
            screen.getByText('Username is available!')
          ).toBeInTheDocument();
        },
        { timeout: 1000 }
      );
    });

    it('should show unavailable state when username is taken', async () => {
      mockCheckUsernameAvailability.mockResolvedValue({
        available: false,
      });

      renderProfilePage();

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText('Choose a unique username')
        ).toBeInTheDocument();
      });

      const usernameInput = screen.getByPlaceholderText(
        'Choose a unique username'
      );

      fireEvent.change(usernameInput, { target: { value: 'takenuser' } });

      await waitFor(
        () => {
          expect(
            screen.getByText('Username is not available')
          ).toBeInTheDocument();
        },
        { timeout: 1000 }
      );
    });

    it('should show loading state while checking availability', async () => {
      // Create a promise that we can control
      let resolvePromise: (value: { available: boolean }) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      mockCheckUsernameAvailability.mockReturnValue(promise);

      renderProfilePage();

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText('Choose a unique username')
        ).toBeInTheDocument();
      });

      const usernameInput = screen.getByPlaceholderText(
        'Choose a unique username'
      );

      fireEvent.change(usernameInput, { target: { value: 'testuser' } });

      await waitFor(
        () => {
          expect(
            screen.getByText('Checking availability...')
          ).toBeInTheDocument();
        },
        { timeout: 1000 }
      );

      // Resolve the promise
      resolvePromise!({ available: true });

      await waitFor(() => {
        expect(screen.getByText('Username is available!')).toBeInTheDocument();
      });
    });
  });

  describe('Username Submission', () => {
    it('should submit username change successfully', async () => {
      mockClaimUsername.mockResolvedValue({
        success: true,
      });

      renderProfilePage();

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText('Choose a unique username')
        ).toBeInTheDocument();
      });

      const usernameInput = screen.getByPlaceholderText(
        'Choose a unique username'
      );
      const submitButton = screen.getByRole('button', {
        name: /update profile/i,
      });

      fireEvent.change(usernameInput, { target: { value: 'newusername' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockClaimUsername).toHaveBeenCalledWith('newusername');
      });
    });

    it('should handle username submission failure', async () => {
      mockClaimUsername.mockResolvedValue({
        success: false,
        error: { message: 'Username already taken' },
      });

      renderProfilePage();

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText('Choose a unique username')
        ).toBeInTheDocument();
      });

      const usernameInput = screen.getByPlaceholderText(
        'Choose a unique username'
      );
      const submitButton = screen.getByRole('button', {
        name: /update profile/i,
      });

      fireEvent.change(usernameInput, { target: { value: 'takenusername' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockClaimUsername).toHaveBeenCalledWith('takenusername');
      });
    });
  });

  describe('Username Validation', () => {
    it('should sanitize username input to lowercase', async () => {
      renderProfilePage();

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText('Choose a unique username')
        ).toBeInTheDocument();
      });

      const usernameInput = screen.getByPlaceholderText(
        'Choose a unique username'
      );

      fireEvent.change(usernameInput, { target: { value: 'TestUser123' } });

      await waitFor(() => {
        expect(usernameInput).toHaveValue('testuser123');
      });
    });

    it('should remove invalid characters from username', async () => {
      renderProfilePage();

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText('Choose a unique username')
        ).toBeInTheDocument();
      });

      const usernameInput = screen.getByPlaceholderText(
        'Choose a unique username'
      );

      fireEvent.change(usernameInput, { target: { value: 'test-user!@#' } });

      await waitFor(() => {
        expect(usernameInput).toHaveValue('testuser');
      });
    });
  });

  describe('Form Integration', () => {
    it('should submit all profile data including username', async () => {
      mockClaimUsername.mockResolvedValue({
        success: true,
      });

      renderProfilePage();

      await waitFor(() => {
        expect(screen.getByDisplayValue('Test User')).toBeInTheDocument();
      });

      const fullNameInput = screen.getByDisplayValue('Test User');
      const usernameInput = screen.getByPlaceholderText(
        'Choose a unique username'
      );
      const submitButton = screen.getByRole('button', {
        name: /update profile/i,
      });

      fireEvent.change(fullNameInput, { target: { value: 'Updated Name' } });
      fireEvent.change(usernameInput, { target: { value: 'newusername' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockClaimUsername).toHaveBeenCalledWith('newusername');
      });
    });

    it('should disable submit button during submission', async () => {
      // Create a promise that we can control
      let resolvePromise: (value: { success: boolean }) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      mockClaimUsername.mockReturnValue(promise);

      renderProfilePage();

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText('Choose a unique username')
        ).toBeInTheDocument();
      });

      const usernameInput = screen.getByPlaceholderText(
        'Choose a unique username'
      );
      const submitButton = screen.getByRole('button', {
        name: /update profile/i,
      });

      fireEvent.change(usernameInput, { target: { value: 'newusername' } });
      fireEvent.click(submitButton);

      // Button should be disabled during submission
      expect(submitButton).toBeDisabled();

      // Resolve the promise
      resolvePromise!({ success: true });

      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
    });
  });
});
