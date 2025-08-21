import { render, screen } from '@testing-library/react';
import { SafetySection } from '@/components/profile/safety/SafetySection';

describe('SafetySection', () => {
  it('renders safety section with header and description', () => {
    render(
      <SafetySection>
        <div>Test content</div>
      </SafetySection>
    );

    expect(screen.getByText('Safety & Dietary')).toBeInTheDocument();
    expect(screen.getByText(/help us keep you safe/i)).toBeInTheDocument();
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <SafetySection className="custom-class">
        <div>Test content</div>
      </SafetySection>
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });
});
