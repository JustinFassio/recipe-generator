import { render, screen } from '@testing-library/react';
import { TagToggleGroup } from '@/components/profile/shared/TagToggleGroup';

describe('TagToggleGroup', () => {
  it('renders children correctly', () => {
    render(
      <TagToggleGroup>
        <button>Tag 1</button>
        <button>Tag 2</button>
      </TagToggleGroup>
    );

    expect(screen.getByText('Tag 1')).toBeInTheDocument();
    expect(screen.getByText('Tag 2')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <TagToggleGroup className="custom-class">
        <button>Tag 1</button>
      </TagToggleGroup>
    );

    const groupElement = container.firstChild as HTMLElement;
    expect(groupElement).toHaveClass('custom-class');
  });

  it('has correct default classes', () => {
    const { container } = render(
      <TagToggleGroup>
        <button>Tag 1</button>
      </TagToggleGroup>
    );

    const groupElement = container.firstChild as HTMLElement;
    expect(groupElement).toHaveClass('flex', 'flex-wrap', 'gap-2');
  });
});
