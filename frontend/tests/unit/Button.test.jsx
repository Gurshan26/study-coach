import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import Button from '../../src/components/shared/Button.jsx';

describe('Button', () => {
  it('supports aria labels and focus ring classes', () => {
    render(
      <Button aria-label="Start studying" variant="primary">
        Start
      </Button>
    );

    const button = screen.getByRole('button', { name: 'Start studying' });
    expect(button.className).toContain('focus-visible:ring-2');
  });

  it('renders variant styles', () => {
    render(<Button variant="danger">Delete</Button>);
    expect(screen.getByRole('button', { name: 'Delete' }).className).toContain('bg-danger');
  });
});
