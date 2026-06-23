import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import Dashboard from './Dashboard.jsx';

vi.mock('dexie-react-hooks', () => ({
  useLiveQuery: (query) => {
    const source = query.toString();
    if (source.includes('getSettings')) return { storeName: 'Kopi Senja', lowStockAlert: true };
    // getDashboardSummary
    return { todaySales: 0, grossProfit: 0, soldCount: 0, wasteValue: 0, lowStock: [] };
  },
}));

describe('Dashboard page', () => {
  it('shows the store name from settings, not the hardcoded label', () => {
    render(<Dashboard />, { wrapper: MemoryRouter });

    expect(screen.getByText(/Kopi Senja/)).toBeInTheDocument();
  });
});
