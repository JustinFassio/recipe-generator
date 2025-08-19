import { render, screen } from '@testing-library/react';
import { SectionCard } from '@/components/profile/shared/SectionCard';

describe('SectionCard', () => {
  it('renders children correctly', () => {
    render(
      <SectionCard>
        <h2>Test Title</h2>
        <p>Test content</p>
      </SectionCard>
    );

    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <SectionCard className="custom-class">
        <div>Test content</div>
      </SectionCard>
    );

    const cardElement = container.querySelector('.card');
    expect(cardElement).toHaveClass('custom-class');
  });

  it('has correct default classes', () => {
    const { container } = render(
      <SectionCard>
        <div>Test content</div>
      </SectionCard>
    );

    const cardElement = container.querySelector('.card');
    expect(cardElement).toHaveClass('bg-base-200', 'shadow-lg');
  });
});
