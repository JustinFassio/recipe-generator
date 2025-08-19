import { render, screen, fireEvent } from '@testing-library/react';
import { User } from 'lucide-react';
import { InlineIconInput } from '@/components/profile/shared/InlineIconInput';

describe('InlineIconInput', () => {
  it('renders input with icon', () => {
    render(
      <InlineIconInput
        icon={User}
        value="test value"
        onChange={() => {}}
        placeholder="Test placeholder"
      />
    );

    expect(screen.getByPlaceholderText('Test placeholder')).toBeInTheDocument();
  });

  it('calls onChange when input changes', () => {
    const mockOnChange = vi.fn();
    render(
      <InlineIconInput
        icon={User}
        value=""
        onChange={mockOnChange}
        placeholder="Test"
      />
    );

    const input = screen.getByPlaceholderText('Test');
    fireEvent.change(input, { target: { value: 'new value' } });

    expect(mockOnChange).toHaveBeenCalledWith('new value');
  });

  it('applies custom className', () => {
    const { container } = render(
      <InlineIconInput
        icon={User}
        value=""
        onChange={() => {}}
        className="custom-class"
      />
    );

    const inputElement = container.querySelector('input');
    expect(inputElement).toHaveClass('custom-class');
  });

  it('has correct default classes', () => {
    const { container } = render(
      <InlineIconInput icon={User} value="" onChange={() => {}} />
    );

    const inputElement = container.querySelector('input');
    expect(inputElement).toHaveClass(
      'input-bordered',
      'input',
      'w-full',
      'pl-10'
    );
  });
});
