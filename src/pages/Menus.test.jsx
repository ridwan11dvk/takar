import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import Menus from './Menus.jsx';

const latteMenu = {
  id: 1,
  name: 'Es Kopi Susu',
  category: 'Minuman',
  sellingPrice: 18000,
  packagingCost: 500,
  utilityCost: 300,
  marketplaceCost: 1000,
  otherCost: 200,
  isActive: true,
};

const coffeeIngredient = {
  id: 10,
  name: 'Kopi bubuk',
  category: 'Kopi',
  unit: 'gram',
  currentStock: 1000,
  minStock: 100,
  avgCostPerUnit: 2000,
};

vi.mock('dexie-react-hooks', () => ({
  useLiveQuery: (query) => {
    const source = query.toString();
    if (source.includes('listMenus')) return [latteMenu];
    if (source.includes('listCategories')) return [{ id: 1, name: 'Minuman' }];
    if (source.includes('listIngredients')) return [coffeeIngredient];
    return [];
  },
}));

vi.mock('../services/recipeService.js', () => ({
  listRecipesByMenu: vi.fn(() => Promise.resolve([{ ingredientId: 10, qty: 5, unit: 'gram' }])),
  saveRecipe: vi.fn(),
}));

describe('Menu & Resep workflow page', () => {
  it('combines menu management and recipe editing on one page', async () => {
    render(<Menus />, { wrapper: MemoryRouter });

    expect(screen.getByRole('heading', { name: 'Menu & Resep' })).toBeInTheDocument();
    expect(screen.getByLabelText('Nama menu')).toBeInTheDocument();

    const recipePanel = screen.getByRole('region', { name: 'Resep menu' });
    expect(within(recipePanel).getByLabelText('Pilih menu')).toHaveValue('1');
    expect(await within(recipePanel).findByRole('button', { name: 'Hapus Kopi bubuk' })).toBeInTheDocument();
  });

  it('shows the total ingredient cost for each recipe quantity', async () => {
    render(<Menus />, { wrapper: MemoryRouter });

    const recipePanel = screen.getByRole('region', { name: 'Resep menu' });

    expect(await within(recipePanel).findByText('Biaya 5 gram')).toBeInTheDocument();
    expect(within(recipePanel).getByText('Rp10.000')).toBeInTheDocument();
    expect(within(recipePanel).getByText('Rp2.000/gram')).toBeInTheDocument();
  });

  it('shows optional costs, total modal, and margin health for UMKM pricing', async () => {
    render(<Menus />, { wrapper: MemoryRouter });

    const recipePanel = screen.getByRole('region', { name: 'Resep menu' });

    expect(await within(recipePanel).findByText('Biaya tambahan')).toBeInTheDocument();
    expect(within(recipePanel).getByText('Rp2.000')).toBeInTheDocument();
    expect(within(recipePanel).getByText('Total modal')).toBeInTheDocument();
    expect(within(recipePanel).getByText('Rp12.000')).toBeInTheDocument();
    expect(within(recipePanel).getByText((content) => content.replace(/\s/g, '') === '33,3%')).toBeInTheDocument();
    expect(within(recipePanel).getByText('Margin sehat')).toBeInTheDocument();
  });

  it('lets the user enter optional per-portion costs on menu data', () => {
    render(<Menus />, { wrapper: MemoryRouter });

    expect(screen.getByLabelText('Biaya kemasan per porsi')).toBeInTheDocument();
    expect(screen.getByLabelText('Biaya operasional per porsi')).toBeInTheDocument();
    expect(screen.getByLabelText('Biaya platform per porsi')).toBeInTheDocument();
    expect(screen.getByLabelText('Biaya lain-lain per porsi')).toBeInTheDocument();
  });
});
