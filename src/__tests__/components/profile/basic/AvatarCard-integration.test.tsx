import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AvatarCard } from '@/components/profile/basic/AvatarCard';
import { useAvatarUpload } from '@/hooks/profile/useAvatarUpload';

// Mock the hook
vi.mock('@/hooks/profile/useAvatarUpload');

const mockUseAvatarUpload = useAvatarUpload as vi.MockedFunction<
  typeof useAvatarUpload
>;

describe('AvatarCard Integration with useAvatarUpload', () => {
  const mockAvatarUpload = {
    avatarUrl: 'https://example.com/avatar.jpg',
    onUpload: vi.fn(),
    loading: false,
  };

  beforeEach(() => {
    mockUseAvatarUpload.mockReturnValue(mockAvatarUpload);
  });

  it('renders avatar card with current avatar', () => {
    render(<AvatarCard {...mockAvatarUpload} />);

    expect(screen.getByAltText('Your profile picture')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /change photo/i })
    ).toBeInTheDocument();
  });

  it('handles file upload', async () => {
    const mockOnUpload = vi.fn();
    render(<AvatarCard {...mockAvatarUpload} onUpload={mockOnUpload} />);

    const fileInput = screen.getByRole('button', { name: /change photo/i });
    const file = new File(['avatar'], 'avatar.jpg', { type: 'image/jpeg' });

    // Simulate file selection by clicking the button and then triggering file input
    fireEvent.click(fileInput);

    // Get the hidden file input and trigger change
    const hiddenFileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    fireEvent.change(hiddenFileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(mockOnUpload).toHaveBeenCalledWith(file);
    });
  });

  it('shows loading state during upload', () => {
    render(<AvatarCard {...mockAvatarUpload} loading={true} />);

    const uploadButton = screen.getByRole('button', { name: /uploading/i });
    expect(uploadButton).toBeDisabled();
  });

  it('displays default avatar when no URL provided', () => {
    render(<AvatarCard {...mockAvatarUpload} avatarUrl={null} />);

    // Should show default avatar placeholder (User icon)
    expect(
      screen.getByRole('button', { name: /change photo/i })
    ).toBeInTheDocument();
    // The User icon should be present in the default avatar
  });

  it('accepts only image files', () => {
    render(<AvatarCard {...mockAvatarUpload} />);

    const hiddenFileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    expect(hiddenFileInput).toHaveAttribute('accept', 'image/*');
  });
});
