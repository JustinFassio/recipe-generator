import { render, screen, fireEvent } from '@testing-library/react';
import { RangeWithTicks } from '@/components/profile/shared/RangeWithTicks';

describe('RangeWithTicks', () => {
  it('renders range input', () => {
    render(<RangeWithTicks value={5} onChange={() => {}} min={1} max={10} />);

    const rangeInput = screen.getByRole('slider');
    expect(rangeInput).toBeInTheDocument();
    expect(rangeInput).toHaveAttribute('min', '1');
    expect(rangeInput).toHaveAttribute('max', '10');
    expect(rangeInput).toHaveAttribute('value', '5');
  });

  it('calls onChange when value changes', () => {
    const mockOnChange = vi.fn();
    render(
      <RangeWithTicks value={5} onChange={mockOnChange} min={1} max={10} />
    );

    const rangeInput = screen.getByRole('slider');
    fireEvent.change(rangeInput, { target: { value: '7' } });

    expect(mockOnChange).toHaveBeenCalledWith(7);
  });

  it('renders ticks when provided', () => {
    const ticks = ['Low', 'Medium', 'High'];
    render(
      <RangeWithTicks
        value={5}
        onChange={() => {}}
        min={1}
        max={10}
        ticks={ticks}
      />
    );

    expect(screen.getByText('Low')).toBeInTheDocument();
    expect(screen.getByText('Medium')).toBeInTheDocument();
    expect(screen.getByText('High')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <RangeWithTicks
        value={5}
        onChange={() => {}}
        min={1}
        max={10}
        className="custom-class"
      />
    );

    const formControlElement = container.querySelector('.form-control');
    expect(formControlElement).toHaveClass('custom-class');
  });

  it('has correct default classes', () => {
    const { container } = render(
      <RangeWithTicks value={5} onChange={() => {}} min={1} max={10} />
    );

    const rangeInput = container.querySelector('input[type="range"]');
    expect(rangeInput).toHaveClass('range', 'range-primary');
  });
});
