import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import More from './More.jsx';

function renderMore() {
  render(<More />, { wrapper: MemoryRouter });
}

describe('More page', () => {
  it('keeps only admin/settings workflows outside Bahan', () => {
    renderMore();

    expect(screen.getByRole('link', { name: /Kategori/i })).toHaveAttribute('href', '/categories');
    expect(screen.getByRole('link', { name: /Pengaturan/i })).toHaveAttribute('href', '/settings');

    expect(screen.queryByRole('link', { name: /Menu & Resep/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Restock/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Waste/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Stok Opname/i })).not.toBeInTheDocument();
  });
});
