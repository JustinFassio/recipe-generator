import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { BioCard } from '@/components/profile/basic/BioCard';

describe('BioCard', () => {
  const mockOnChange = vi.fn();
  const mockOnSave = vi.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
    mockOnSave.mockClear();
  });

  it('renders bio card with textarea and character counter', () => {
    render(
      <BioCard
        bio="Test bio"
        onChange={mockOnChange}
        onSave={mockOnSave}
        loading={false}
      />
    );

    expect(screen.getByText('About Me')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test bio')).toBeInTheDocument();
    expect(screen.getByText('8/500')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /save bio/i })
    ).toBeInTheDocument();
  });

  it('calls onChange when textarea value changes', () => {
    render(
      <BioCard
        bio=""
        onChange={mockOnChange}
        onSave={mockOnSave}
        loading={false}
      />
    );

    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'New bio content' } });

    expect(mockOnChange).toHaveBeenCalledWith('New bio content');
  });

  it('calls onSave when save button is clicked', async () => {
    render(
      <BioCard
        bio="Test bio"
        onChange={mockOnChange}
        onSave={mockOnSave}
        loading={false}
      />
    );

    const saveButton = screen.getByRole('button', { name: /save bio/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalled();
    });
  });

  it('shows loading state when saving', () => {
    render(
      <BioCard
        bio="Test bio"
        onChange={mockOnChange}
        onSave={mockOnSave}
        loading={true}
      />
    );

    const saveButton = screen.getByRole('button', { name: /saving/i });
    expect(saveButton).toBeDisabled();
  });

  it('respects maxLength of 500 characters', () => {
    render(
      <BioCard
        bio=""
        onChange={mockOnChange}
        onSave={mockOnSave}
        loading={false}
      />
    );

    const textarea = screen.getByRole('textbox');
    expect(textarea).toHaveAttribute('maxLength', '500');
  });
});
