import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProfileInfoForm } from '@/components/profile/basic/ProfileInfoForm';
import { useProfileBasics } from '@/hooks/profile/useProfileBasics';
import { useUsernameAvailability } from '@/hooks/profile/useUsernameAvailability';

// Mock the hooks
vi.mock('@/hooks/profile/useProfileBasics');
vi.mock('@/hooks/profile/useUsernameAvailability');

const mockUseProfileBasics = useProfileBasics as vi.MockedFunction<
  typeof useProfileBasics
>;
const mockUseUsernameAvailability =
  useUsernameAvailability as vi.MockedFunction<typeof useUsernameAvailability>;

describe('ProfileInfoForm Integration with Hooks', () => {
  const mockProfileBasics = {
    fullName: 'John Doe',
    onFullNameChange: vi.fn(),
    region: 'North America',
    onRegionChange: vi.fn(),
    language: 'en',
    onLanguageChange: vi.fn(),
    units: 'metric',
    onUnitsChange: vi.fn(),
    timePerMeal: 3,
    onTimePerMealChange: vi.fn(),
    skillLevel: '2',
    onSkillLevelChange: vi.fn(),
    onSubmit: vi.fn(),
    submitting: false,
  };

  const mockUsernameAvailability = {
    username: '',
    onUsernameChange: vi.fn(),
    usernameAvailable: null,
    usernameChecking: false,
    currentUsername: null,
  };

  beforeEach(() => {
    mockUseProfileBasics.mockReturnValue(mockProfileBasics);
    mockUseUsernameAvailability.mockReturnValue(mockUsernameAvailability);
  });

  it('renders form with all fields and handles interactions', async () => {
    render(
      <ProfileInfoForm {...mockProfileBasics} {...mockUsernameAvailability} />
    );

    // Check that all form fields are rendered
    expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
    expect(screen.getByDisplayValue('North America')).toBeInTheDocument();
    expect(
      screen.getByRole('combobox', { name: /language/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('combobox', { name: /measurement units/i })
    ).toBeInTheDocument();
    expect(screen.getByText('Time Per Meal: 45m')).toBeInTheDocument();
    expect(
      screen.getByText('Cooking Skill Level: Intermediate')
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /update profile/i })
    ).toBeInTheDocument();
  });

  it('handles form submission', async () => {
    const mockOnSubmit = vi.fn();
    render(
      <ProfileInfoForm
        {...mockProfileBasics}
        {...mockUsernameAvailability}
        onSubmit={mockOnSubmit}
      />
    );

    const submitButton = screen.getByRole('button', {
      name: /update profile/i,
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
    });
  });

  it('handles language selection change', async () => {
    const mockOnLanguageChange = vi.fn();
    render(
      <ProfileInfoForm
        {...mockProfileBasics}
        {...mockUsernameAvailability}
        onLanguageChange={mockOnLanguageChange}
      />
    );

    const languageSelect = screen.getByRole('combobox', { name: /language/i });
    fireEvent.change(languageSelect, { target: { value: 'es' } });

    expect(mockOnLanguageChange).toHaveBeenCalledWith('es');
  });

  it('handles units selection change', async () => {
    const mockOnUnitsChange = vi.fn();
    render(
      <ProfileInfoForm
        {...mockProfileBasics}
        {...mockUsernameAvailability}
        onUnitsChange={mockOnUnitsChange}
      />
    );

    const unitsSelect = screen.getByRole('combobox', {
      name: /measurement units/i,
    });
    fireEvent.change(unitsSelect, { target: { value: 'imperial' } });

    expect(mockOnUnitsChange).toHaveBeenCalledWith('imperial');
  });

  it('shows loading state during submission', () => {
    render(
      <ProfileInfoForm
        {...mockProfileBasics}
        {...mockUsernameAvailability}
        submitting={true}
      />
    );

    const submitButton = screen.getByRole('button', { name: /updating/i });
    expect(submitButton).toBeDisabled();
  });

  it('displays current username when available', () => {
    const mockWithCurrentUsername = {
      ...mockUsernameAvailability,
      currentUsername: 'existinguser',
      username: 'newuser',
      usernameAvailable: true,
    };

    render(
      <ProfileInfoForm {...mockProfileBasics} {...mockWithCurrentUsername} />
    );

    expect(screen.getByDisplayValue('existinguser')).toBeInTheDocument();
    expect(screen.getByDisplayValue('newuser')).toBeInTheDocument();
    expect(screen.getByText('Username is available!')).toBeInTheDocument();
  });

  it('shows username availability status', () => {
    const mockWithUsernameCheck = {
      ...mockUsernameAvailability,
      username: 'testuser',
      usernameAvailable: false,
    };

    render(
      <ProfileInfoForm {...mockProfileBasics} {...mockWithUsernameCheck} />
    );

    expect(screen.getByText('Username is not available')).toBeInTheDocument();
  });
});
