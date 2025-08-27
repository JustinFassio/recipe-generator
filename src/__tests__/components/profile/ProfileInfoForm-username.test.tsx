import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProfileInfoForm } from '@/components/profile/basic/ProfileInfoForm';

// Mock the hooks
vi.mock('@/hooks/profile/useUsernameAvailability', () => ({
  useUsernameAvailability: vi.fn(),
}));

vi.mock('@/hooks/profile/useProfileBasics', () => ({
  useProfileBasics: vi.fn(),
}));

describe('ProfileInfoForm Username Functionality', () => {
  const mockOnSubmit = vi.fn();
  const mockOnUsernameChange = vi.fn();
  const mockOnFullNameChange = vi.fn();
  const mockOnRegionChange = vi.fn();
  const mockOnLanguageChange = vi.fn();
  const mockOnUnitsChange = vi.fn();
  const mockOnTimePerMealChange = vi.fn();
  const mockOnSkillLevelChange = vi.fn();

  const defaultProps = {
    fullName: 'John Doe',
    onFullNameChange: mockOnFullNameChange,
    username: '',
    onUsernameChange: mockOnUsernameChange,
    usernameAvailable: null,
    usernameChecking: false,
    currentUsername: null,
    region: 'North America',
    onRegionChange: mockOnRegionChange,
    language: 'en',
    onLanguageChange: mockOnLanguageChange,
    units: 'metric',
    onUnitsChange: mockOnUnitsChange,
    timePerMeal: 3,
    onTimePerMealChange: mockOnTimePerMealChange,
    skillLevel: 'intermediate',
    onSkillLevelChange: mockOnSkillLevelChange,
    onSubmit: mockOnSubmit,
    submitting: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Username Display', () => {
    it('should not show current username field when no current username', () => {
      render(<ProfileInfoForm {...defaultProps} />);

      expect(screen.queryByText('Current Username')).not.toBeInTheDocument();
      expect(screen.getByText('Claim Username')).toBeInTheDocument();
    });

    it('should show current username field when current username exists', () => {
      render(<ProfileInfoForm {...defaultProps} currentUsername="johndoe" />);

      expect(screen.getByText('Current Username')).toBeInTheDocument();
      expect(screen.getByDisplayValue('johndoe')).toBeInTheDocument();
      expect(screen.getByText('Change Username')).toBeInTheDocument();
    });

    it('should show current username as disabled input', () => {
      render(<ProfileInfoForm {...defaultProps} currentUsername="johndoe" />);

      const currentUsernameInput = screen.getByDisplayValue('johndoe');
      expect(currentUsernameInput).toBeDisabled();
    });
  });

  describe('Username Input', () => {
    it('should call onUsernameChange when typing in username field', () => {
      render(<ProfileInfoForm {...defaultProps} />);

      const usernameInput = screen.getByPlaceholderText(
        'Choose a unique username'
      );
      fireEvent.change(usernameInput, { target: { value: 'newusername' } });

      expect(mockOnUsernameChange).toHaveBeenCalledWith('newusername');
    });

    it('should show username input with correct attributes', () => {
      render(<ProfileInfoForm {...defaultProps} />);

      const usernameInput = screen.getByPlaceholderText(
        'Choose a unique username'
      );
      expect(usernameInput).toHaveAttribute('pattern', '^[a-z0-9_]+$');
      expect(usernameInput).toHaveAttribute('minLength', '3');
      expect(usernameInput).toHaveAttribute('maxLength', '24');
    });
  });

  describe('Username Availability Feedback', () => {
    it('should show loading spinner when checking availability', () => {
      render(
        <ProfileInfoForm
          {...defaultProps}
          username="testuser"
          usernameChecking={true}
        />
      );

      // Check that the loading spinner is present
      const loadingSpinner = document.querySelector('.animate-spin');
      expect(loadingSpinner).toBeInTheDocument();
    });

    it('should show success state when username is available', () => {
      render(
        <ProfileInfoForm
          {...defaultProps}
          username="availableuser"
          usernameAvailable={true}
        />
      );

      const usernameInput = screen.getByDisplayValue('availableuser');
      expect(usernameInput).toHaveClass('border-success');
      expect(screen.getByText('Username is available!')).toBeInTheDocument();
    });

    it('should show error state when username is not available', () => {
      render(
        <ProfileInfoForm
          {...defaultProps}
          username="takenuser"
          usernameAvailable={false}
        />
      );

      const usernameInput = screen.getByDisplayValue('takenuser');
      expect(usernameInput).toHaveClass('border-error');
      expect(screen.getByText('Username is not available')).toBeInTheDocument();
    });

    it('should show helper text for empty username', () => {
      render(<ProfileInfoForm {...defaultProps} username="ab" />);

      expect(
        screen.getByText(
          'Enter 3-24 characters (lowercase letters, numbers, _)'
        )
      ).toBeInTheDocument();
    });

    it('should show checking message when checking availability', () => {
      render(
        <ProfileInfoForm
          {...defaultProps}
          username="testuser"
          usernameChecking={true}
        />
      );

      expect(screen.getByText('Checking availability...')).toBeInTheDocument();
    });
  });

  describe('Username Icons', () => {
    it('should show check icon when username is available', () => {
      render(
        <ProfileInfoForm
          {...defaultProps}
          username="availableuser"
          usernameAvailable={true}
        />
      );

      // Check icon should be present (Check component)
      const checkIcon = document.querySelector('.text-success');
      expect(checkIcon).toBeInTheDocument();
    });

    it('should show X icon when username is not available', () => {
      render(
        <ProfileInfoForm
          {...defaultProps}
          username="takenuser"
          usernameAvailable={false}
        />
      );

      // X icon should be present (X component)
      const xIcon = document.querySelector('.text-error');
      expect(xIcon).toBeInTheDocument();
    });

    it('should not show icons when username is empty', () => {
      render(<ProfileInfoForm {...defaultProps} />);

      const checkIcon = document.querySelector('.text-success');
      const xIcon = document.querySelector('.text-error');
      expect(checkIcon).not.toBeInTheDocument();
      expect(xIcon).not.toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    it('should call onSubmit when form is submitted', async () => {
      render(<ProfileInfoForm {...defaultProps} />);

      const submitButton = screen.getByRole('button', {
        name: /update profile/i,
      });
      fireEvent.click(submitButton);

      expect(mockOnSubmit).toHaveBeenCalled();
    });

    it('should disable submit button when submitting', () => {
      render(<ProfileInfoForm {...defaultProps} submitting={true} />);

      const submitButton = screen.getByRole('button', {
        name: /updating/i,
      });
      expect(submitButton).toBeDisabled();
    });

    it('should show loading state on submit button when submitting', () => {
      render(<ProfileInfoForm {...defaultProps} submitting={true} />);

      const submitButton = screen.getByRole('button', {
        name: /updating/i,
      });
      expect(submitButton).toHaveTextContent('Updating...');
    });
  });

  describe('Username Validation', () => {
    it('should apply success border class when username is available', () => {
      render(
        <ProfileInfoForm
          {...defaultProps}
          username="validuser"
          usernameAvailable={true}
        />
      );

      const usernameInput = screen.getByDisplayValue('validuser');
      expect(usernameInput).toHaveClass('border-success');
    });

    it('should apply error border class when username is not available', () => {
      render(
        <ProfileInfoForm
          {...defaultProps}
          username="takenuser"
          usernameAvailable={false}
        />
      );

      const usernameInput = screen.getByDisplayValue('takenuser');
      expect(usernameInput).toHaveClass('border-error');
    });

    it('should not apply border classes when username is empty', () => {
      render(<ProfileInfoForm {...defaultProps} />);

      const usernameInput = screen.getByPlaceholderText(
        'Choose a unique username'
      );
      expect(usernameInput).not.toHaveClass('border-success');
      expect(usernameInput).not.toHaveClass('border-error');
    });
  });

  describe('Accessibility', () => {
    it('should have proper labels for username fields', () => {
      render(<ProfileInfoForm {...defaultProps} currentUsername="johndoe" />);

      expect(screen.getByText('Current Username')).toBeInTheDocument();
      expect(screen.getByText('Change Username')).toBeInTheDocument();
    });

    it('should have proper labels when no current username', () => {
      render(<ProfileInfoForm {...defaultProps} />);

      expect(screen.getByText('Claim Username')).toBeInTheDocument();
    });

    it('should show loading spinner when checking availability', () => {
      render(
        <ProfileInfoForm
          {...defaultProps}
          username="testuser"
          usernameChecking={true}
        />
      );

      // Check that the loading spinner is present
      const loadingSpinner = document.querySelector('.animate-spin');
      expect(loadingSpinner).toBeInTheDocument();
    });
  });
});
