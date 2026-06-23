import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import Recipe from './Recipe.jsx';
import { labels } from '../utils/labels.js';

vi.mock('dexie-react-hooks', () => ({
  useLiveQuery: () => ({ menus: [], ingredients: [], recipes: [] }),
}));

describe('Recipe page', () => {
  it('renders a non-blank empty state when recipe data is unavailable', () => {
    render(<Recipe />, { wrapper: MemoryRouter });

    expect(screen.getByRole('heading', { name: labels.recipes })).toBeInTheDocument();
    expect(screen.getByText(labels.noData)).toBeInTheDocument();
  });
});
