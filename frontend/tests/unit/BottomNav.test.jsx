import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import BottomNav from '../../src/components/layout/BottomNav.jsx';

describe('BottomNav', () => {
  it('marks active route on mobile nav', () => {
    render(
      <MemoryRouter initialEntries={['/quiz']}>
        <BottomNav />
      </MemoryRouter>
    );

    const quizLink = screen.getByRole('link', { name: /Quiz/i });
    const dashboardLink = screen.getByRole('link', { name: /Dashboard/i });

    expect(quizLink).toHaveAttribute('aria-current', 'page');
    expect(dashboardLink).not.toHaveAttribute('aria-current', 'page');
  });
});
