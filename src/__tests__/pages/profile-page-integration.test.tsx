import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ProfilePage from '@/pages/profile-page';
import { useProfileBasics } from '@/hooks/profile/useProfileBasics';
import { useUsernameAvailability } from '@/hooks/profile/useUsernameAvailability';
import { useAvatarUpload } from '@/hooks/profile/useAvatarUpload';
import { useBioUpdate } from '@/hooks/profile/useBioUpdate';
import { useUserSafety } from '@/hooks/profile/useUserSafety';
import { useCookingPreferences } from '@/hooks/profile/useCookingPreferences';
import { useAccountManagement } from '@/hooks/profile/useAccountManagement';

// Mock all hooks
vi.mock('@/hooks/profile/useProfileBasics');
vi.mock('@/hooks/profile/useUsernameAvailability');
vi.mock('@/hooks/profile/useAvatarUpload');
vi.mock('@/hooks/profile/useBioUpdate');
vi.mock('@/hooks/profile/useUserSafety');
vi.mock('@/hooks/profile/useCookingPreferences');
vi.mock('@/hooks/profile/useAccountManagement');

const mockUseProfileBasics = useProfileBasics as vi.MockedFunction<typeof useProfileBasics>;
const mockUseUsernameAvailability = useUsernameAvailability as vi.MockedFunction<typeof useUsernameAvailability>;
const mockUseAvatarUpload = useAvatarUpload as vi.MockedFunction<typeof useAvatarUpload>;
const mockUseBioUpdate = useBioUpdate as vi.MockedFunction<typeof useBioUpdate>;
const mockUseUserSafety = useUserSafety as vi.MockedFunction<typeof useUserSafety>;
const mockUseCookingPreferences = useCookingPreferences as vi.MockedFunction<typeof useCookingPreferences>;
const mockUseAccountManagement = useAccountManagement as vi.MockedFunction<typeof useAccountManagement>;

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('ProfilePage Integration Tests', () => {
  const mockProfileBasics = {
    fullName: 'John Doe',
    setFullName: vi.fn(),
    region: 'North America',
    setRegion: vi.fn(),
    language: 'en',
    setLanguage: vi.fn(),
    units: 'metric',
    setUnits: vi.fn(),
    timePerMeal: 3,
    setTimePerMeal: vi.fn(),
    skillLevel: '2',
    setSkillLevel: vi.fn(),
    updateProfileBasics: vi.fn().mockResolvedValue(true),
  };

  const mockUsernameAvailability = {
    username: '',
    handleUsernameChange: vi.fn(),
    isAvailable: null as boolean | null,
    isChecking: false,
    claimUsername: vi.fn().mockResolvedValue(true),
  };

  const mockAvatarUpload = {
    loading: false,
    uploadAvatar: vi.fn().mockResolvedValue(undefined),
  };

  const mockBioUpdate = {
    bio: 'I love cooking!',
    setBio: vi.fn(),
    saveBio: vi.fn().mockResolvedValue(undefined),
    loading: false,
  };

  const mockUserSafety = {
    allergies: ['nuts'],
    setAllergies: vi.fn(),
    dietaryRestrictions: ['vegetarian'],
    setDietaryRestrictions: vi.fn(),
    medicalConditions: [],
    setMedicalConditions: vi.fn(),
    saveUserSafety: vi.fn().mockResolvedValue(true),
    loadUserSafety: vi.fn().mockResolvedValue(undefined),
    loading: false,
  };

  const mockCookingPreferences = {
    preferredCuisines: ['italian'],
    setPreferredCuisines: vi.fn(),
    availableEquipment: ['blender'],
    setAvailableEquipment: vi.fn(),
    dislikedIngredients: ['cilantro'],
    setDislikedIngredients: vi.fn(),
    spiceTolerance: 3,
    setSpiceTolerance: vi.fn(),
    saveCookingPreferences: vi.fn().mockResolvedValue(undefined),
    loadCookingPreferences: vi.fn().mockResolvedValue(undefined),
    loading: false,
  };

  const mockAccountManagement = {
    currentEmail: 'test@example.com',
    newEmail: '',
    setNewEmail: vi.fn(),
    updateEmailAddress: vi.fn().mockResolvedValue(undefined),
    emailLoading: false,
    newPassword: '',
    setNewPassword: vi.fn(),
    confirmPassword: '',
    setConfirmPassword: vi.fn(),
    updateUserPassword: vi.fn().mockResolvedValue(undefined),
    passwordLoading: false,
  };

  beforeEach(() => {
    mockUseProfileBasics.mockReturnValue(mockProfileBasics as any);
    mockUseUsernameAvailability.mockReturnValue(mockUsernameAvailability as any);
    mockUseAvatarUpload.mockReturnValue(mockAvatarUpload as any);
    mockUseBioUpdate.mockReturnValue(mockBioUpdate as any);
    mockUseUserSafety.mockReturnValue(mockUserSafety as any);
    mockUseCookingPreferences.mockReturnValue(mockCookingPreferences as any);
    mockUseAccountManagement.mockReturnValue(mockAccountManagement as any);
  });

  it('renders all profile sections', () => {
    renderWithRouter(<ProfilePage />);

    expect(screen.getByText('Profile Information')).toBeInTheDocument();
    expect(screen.getByText('About Me')).toBeInTheDocument();
    expect(screen.getByText(/Safety \& Dietary/i)).toBeInTheDocument();
    expect(screen.getByText('Cooking Preferences')).toBeInTheDocument();
    expect(screen.getByText('Account')).toBeInTheDocument();
  });

  it('displays user information correctly', () => {
    renderWithRouter(<ProfilePage />);

    expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
    expect(screen.getByDisplayValue('North America')).toBeInTheDocument();
    expect(screen.getByDisplayValue('I love cooking!')).toBeInTheDocument();
    expect(screen.getByText('Account')).toBeInTheDocument();
  });

  it('handles profile form submission', async () => {
    const spy = vi.fn().mockResolvedValue(true);
    mockUseProfileBasics.mockReturnValue({
      ...mockProfileBasics,
      updateProfileBasics: spy,
    } as any);

    renderWithRouter(<ProfilePage />);

    const submitButton = screen.getByRole('button', { name: /update profile/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  it('handles bio save', async () => {
    const spy = vi.fn().mockResolvedValue(undefined);
    mockUseBioUpdate.mockReturnValue({
      ...mockBioUpdate,
      saveBio: spy,
    } as any);

    renderWithRouter(<ProfilePage />);

    const saveButton = screen.getByRole('button', { name: /save bio/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  it('handles safety save', async () => {
    const spy = vi.fn().mockResolvedValue(true);
    mockUseUserSafety.mockReturnValue({
      ...mockUserSafety,
      saveUserSafety: spy,
    } as any);

    renderWithRouter(<ProfilePage />);

    const saveButton = screen.getByRole('button', { name: /save safety preferences/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  it('handles cooking preferences save', async () => {
    const spy = vi.fn().mockResolvedValue(undefined);
    mockUseCookingPreferences.mockReturnValue({
      ...mockCookingPreferences,
      saveCookingPreferences: spy,
    } as any);

    renderWithRouter(<ProfilePage />);

    const saveButton = screen.getByRole('button', { name: /save cooking preferences/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  it('shows loading states correctly', () => {
    mockUseBioUpdate.mockReturnValue({ ...mockBioUpdate, loading: true } as any);
    mockUseUserSafety.mockReturnValue({ ...mockUserSafety, loading: true } as any);
    mockUseCookingPreferences.mockReturnValue({ ...mockCookingPreferences, loading: true } as any);

    renderWithRouter(<ProfilePage />);

    expect(screen.getAllByRole('button', { name: /saving/i }).length).toBeGreaterThan(0);
  });

  it('displays safety information', () => {
    renderWithRouter(<ProfilePage />);

    expect(screen.getByText('Allergies')).toBeInTheDocument();
    expect(screen.getByText('Dietary Restrictions')).toBeInTheDocument();
    expect(screen.getByText('Medical Conditions')).toBeInTheDocument();
  });

  it('displays cooking preferences', () => {
    renderWithRouter(<ProfilePage />);

    expect(screen.getByText('Preferred Cuisines')).toBeInTheDocument();
    expect(screen.getByText('Disliked Ingredients')).toBeInTheDocument();
    expect(screen.getByText('Available Equipment')).toBeInTheDocument();
    expect(screen.getByText(/Spice Tolerance:/i)).toBeInTheDocument();
  });
});
