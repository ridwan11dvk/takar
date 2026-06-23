import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Ingredients from './Ingredients.jsx';
import { labels } from '../utils/labels.js';

vi.mock('dexie-react-hooks', () => ({
  useLiveQuery: (query) => {
    const source = query.toString();
    if (source.includes('listIngredients')) return [];
    if (source.includes('listCategories')) return [];
    return [];
  },
}));

describe('Ingredients page', () => {
  it('renders a non-blank empty state when ingredients and categories are not loaded', () => {
    render(<Ingredients />);

    expect(screen.getByRole('heading', { name: labels.ingredientsTitle })).toBeInTheDocument();
    expect(screen.getByText(labels.emptyIngredients)).toBeInTheDocument();
  });
});
