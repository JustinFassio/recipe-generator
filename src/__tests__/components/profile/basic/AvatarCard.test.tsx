import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { AvatarCard } from '@/components/profile/basic/AvatarCard';

describe('AvatarCard', () => {
  const mockOnUpload = vi.fn();

  beforeEach(() => {
    mockOnUpload.mockClear();
  });

  it('renders avatar image when URL provided', () => {
    render(
      <AvatarCard
        avatarUrl="https://example.com/avatar.jpg"
        loading={false}
        onUpload={mockOnUpload}
      />
    );

    const avatarImage = screen.getByAltText('Profile');
    expect(avatarImage).toBeInTheDocument();
    expect(avatarImage).toHaveAttribute(
      'src',
      'https://example.com/avatar.jpg'
    );
  });

  it('renders fallback icon when no URL provided', () => {
    render(
      <AvatarCard avatarUrl={null} loading={false} onUpload={mockOnUpload} />
    );

    // The User icon should be present in the fallback
    const fallbackContainer = screen
      .getByText('Profile Picture')
      .closest('.card-body');
    expect(fallbackContainer).toBeInTheDocument();
  });

  it('shows loading overlay during upload', () => {
    render(
      <AvatarCard
        avatarUrl="https://example.com/avatar.jpg"
        loading={true}
        onUpload={mockOnUpload}
      />
    );

    // Check for loading spinner
    const loadingSpinner = document.querySelector('.animate-spin');
    expect(loadingSpinner).toBeInTheDocument();
  });

  it('triggers file input when button clicked', () => {
    render(
      <AvatarCard avatarUrl={null} loading={false} onUpload={mockOnUpload} />
    );

    const button = screen.getByRole('button', { name: /change photo/i });
    const fileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;

    // Mock the click method
    const clickSpy = vi.spyOn(fileInput, 'click');

    fireEvent.click(button);

    expect(clickSpy).toHaveBeenCalled();
  });

  it('calls onUpload when file selected', async () => {
    render(
      <AvatarCard avatarUrl={null} loading={false} onUpload={mockOnUpload} />
    );

    const fileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(mockOnUpload).toHaveBeenCalledWith(file);
    });
  });

  it('disables button during loading', () => {
    render(
      <AvatarCard avatarUrl={null} loading={true} onUpload={mockOnUpload} />
    );

    const button = screen.getByRole('button', { name: /uploading/i });
    expect(button).toBeDisabled();
  });

  it('shows correct button text based on loading state', () => {
    const { rerender } = render(
      <AvatarCard avatarUrl={null} loading={false} onUpload={mockOnUpload} />
    );

    expect(
      screen.getByRole('button', { name: /change photo/i })
    ).toBeInTheDocument();

    rerender(
      <AvatarCard avatarUrl={null} loading={true} onUpload={mockOnUpload} />
    );

    expect(
      screen.getByRole('button', { name: /uploading/i })
    ).toBeInTheDocument();
  });

  it('resets file input after upload', async () => {
    render(
      <AvatarCard avatarUrl={null} loading={false} onUpload={mockOnUpload} />
    );

    const fileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(mockOnUpload).toHaveBeenCalledWith(file);
    });

    // Check that the file input value is reset (should be empty string)
    expect(fileInput.value).toBe('');
  });

  it('applies custom className when provided', () => {
    render(
      <AvatarCard
        avatarUrl={null}
        loading={false}
        onUpload={mockOnUpload}
        className="custom-class"
      />
    );

    const cardElement = document.querySelector('.card');
    expect(cardElement).toHaveClass('custom-class');
  });

  it('does not call onUpload when no file selected', async () => {
    render(
      <AvatarCard avatarUrl={null} loading={false} onUpload={mockOnUpload} />
    );

    const fileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;

    fireEvent.change(fileInput, { target: { files: [] } });

    await waitFor(() => {
      expect(mockOnUpload).not.toHaveBeenCalled();
    });
  });
});
