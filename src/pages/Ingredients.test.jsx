import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import Ingredients from './Ingredients.jsx';
import { labels } from '../utils/labels.js';

const ingredients = [
  { id: 1, name: 'Kopi bubuk', category: 'Kopi', unit: 'gram', currentStock: 1000, minStock: 100, avgCostPerUnit: 200, lastPurchasePrice: 200000 },
  { id: 2, name: 'Susu UHT', category: 'Dairy', unit: 'ml', currentStock: 200, minStock: 500, avgCostPerUnit: 25, lastPurchasePrice: 25000 },
  { id: 3, name: 'Cup 16oz', category: 'Kemasan', unit: 'pcs', currentStock: -3, minStock: 20, avgCostPerUnit: 800, lastPurchasePrice: 80000 },
];

vi.mock('dexie-react-hooks', () => ({
  useLiveQuery: (query) => {
    const source = query.toString();
    if (source.includes('listIngredients')) return ingredients;
    if (source.includes('listCategories')) return [
      { id: 1, name: 'Kopi' },
      { id: 2, name: 'Dairy' },
      { id: 3, name: 'Kemasan' },
    ];
    return [];
  },
}));

function renderIngredients() {
  render(<Ingredients />, { wrapper: MemoryRouter });
}

describe('Ingredients page', () => {
  it('renders a Stok Bahan Baku hub with stock summary', () => {
    renderIngredients();

    expect(screen.getByRole('heading', { name: 'Stok Bahan Baku' })).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText(labels.lowStock)).toBeInTheDocument();
    expect(screen.getAllByText(labels.minus)[0]).toBeInTheDocument();
  });

  it('moves stock-related workflows into quick actions on Bahan', () => {
    renderIngredients();

    const quickActions = screen.getByRole('navigation', { name: labels.stockQuickActions });

    expect(within(quickActions).getByRole('link', { name: /Menu & Resep/i })).toHaveAttribute('href', '/menus');
    expect(within(quickActions).getByRole('link', { name: /Restock/i })).toHaveAttribute('href', '/restock');
    expect(within(quickActions).getByRole('link', { name: /Waste/i })).toHaveAttribute('href', '/waste');
    expect(within(quickActions).getByRole('link', { name: /Stok Opname/i })).toHaveAttribute('href', '/stock-count');
  });

  it('shows Bahan workflow sections for stock, HPP, and stock activity', () => {
    renderIngredients();

    const sections = screen.getByRole('tablist', { name: labels.stockSections });

    expect(within(sections).getByRole('tab', { name: labels.stockTabStock })).toBeInTheDocument();
    expect(within(sections).getByRole('tab', { name: labels.stockTabHpp })).toBeInTheDocument();
    expect(within(sections).getByRole('tab', { name: labels.stockTabActivity })).toBeInTheDocument();
  });
});
