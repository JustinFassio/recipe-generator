import { render, screen } from '@testing-library/react';
import { FieldLabel } from '@/components/profile/shared/FieldLabel';

describe('FieldLabel', () => {
  it('renders children correctly', () => {
    render(<FieldLabel>Test Label</FieldLabel>);

    expect(screen.getByText('Test Label')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <FieldLabel className="custom-class">Test Label</FieldLabel>
    );

    const labelElement = container.querySelector('.label');
    expect(labelElement).toHaveClass('custom-class');
  });

  it('has correct default structure', () => {
    const { container } = render(<FieldLabel>Test Label</FieldLabel>);

    const labelElement = container.querySelector('.label');
    const spanElement = container.querySelector('.label-text');

    expect(labelElement).toBeInTheDocument();
    expect(spanElement).toBeInTheDocument();
  });

  it('applies htmlFor attribute when provided', () => {
    const { container } = render(
      <FieldLabel htmlFor="test-input">Test Label</FieldLabel>
    );

    const labelElement = container.querySelector('.label');
    expect(labelElement).toHaveAttribute('for', 'test-input');
  });

  it('does not apply htmlFor attribute when not provided', () => {
    const { container } = render(<FieldLabel>Test Label</FieldLabel>);

    const labelElement = container.querySelector('.label');
    expect(labelElement).not.toHaveAttribute('for');
  });
});
