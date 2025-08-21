import { render, screen } from '@testing-library/react';
import { CookingSection } from '@/components/profile/cooking/CookingSection';

describe('CookingSection', () => {
  it('renders cooking section with header and description', () => {
    render(
      <CookingSection>
        <div>Test content</div>
      </CookingSection>
    );

    expect(screen.getByText('Cooking Preferences')).toBeInTheDocument();
    expect(
      screen.getByText(/tell us about your cooking style/i)
    ).toBeInTheDocument();
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <CookingSection className="custom-class">
        <div>Test content</div>
      </CookingSection>
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });
});
