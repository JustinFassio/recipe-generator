import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BioCard } from '@/components/profile/basic/BioCard';
import { useBioUpdate } from '@/hooks/profile/useBioUpdate';

// Mock the hook
vi.mock('@/hooks/profile/useBioUpdate');

const mockUseBioUpdate = useBioUpdate as vi.MockedFunction<typeof useBioUpdate>;

describe('BioCard Integration with useBioUpdate', () => {
  const mockBioUpdate = {
    bio: 'I love cooking Italian food!',
    onBioChange: vi.fn(),
    onSave: vi.fn(),
    saving: false,
  };

  beforeEach(() => {
    mockUseBioUpdate.mockReturnValue(mockBioUpdate);
  });

  it('renders bio card with current bio', () => {
    render(<BioCard {...mockBioUpdate} />);

    expect(screen.getByDisplayValue('I love cooking Italian food!')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save bio/i })).toBeInTheDocument();
  });

  it('handles bio text change', () => {
    const mockOnBioChange = vi.fn();
    render(<BioCard {...mockBioUpdate} onChange={mockOnBioChange} />);

    const textarea = screen.getByDisplayValue('I love cooking Italian food!');
    fireEvent.change(textarea, { target: { value: 'Updated bio text' } });

    expect(mockOnBioChange).toHaveBeenCalledWith('Updated bio text');
  });

  it('handles save button click', async () => {
    const mockOnSave = vi.fn();
    render(<BioCard {...mockBioUpdate} onSave={mockOnSave} />);

    const saveButton = screen.getByRole('button', { name: /save bio/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledTimes(1);
    });
  });

  it('shows loading state during save', () => {
    render(<BioCard {...mockBioUpdate} loading={true} />);

    const saveButton = screen.getByRole('button', { name: /saving/i });
    expect(saveButton).toBeDisabled();
  });

  it('displays empty bio when none provided', () => {
    render(<BioCard {...mockBioUpdate} bio="" />);

    const textarea = screen.getByPlaceholderText(/tell us a bit about yourself/i);
    expect(textarea).toBeInTheDocument();
    expect(textarea).toHaveValue('');
  });

  it('has proper textarea attributes', () => {
    render(<BioCard {...mockBioUpdate} />);

    const textarea = screen.getByDisplayValue('I love cooking Italian food!');
    expect(textarea).toHaveAttribute('rows', '4');
    expect(textarea).toHaveAttribute('maxLength', '500');
  });
});
