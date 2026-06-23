import { render } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import AppShell from './AppShell.jsx';

vi.mock('../../db/seed.js', () => ({
  seedDatabase: vi.fn(),
}));

vi.mock('./BottomNav.jsx', () => ({
  default: () => <nav>Bottom Nav</nav>,
}));

describe('AppShell', () => {
  it('does not seed sample data automatically on app load', async () => {
    const { seedDatabase } = await import('../../db/seed.js');

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<main>Home</main>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(seedDatabase).not.toHaveBeenCalled();
  });
});
