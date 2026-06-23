import { describe, expect, it } from 'vitest';
import { enrichStockMovements } from './reportService.js';

describe('report service helpers', () => {
  it('adds ingredient names and related sale item names to stock movements', () => {
    const movements = enrichStockMovements({
      stockMovements: [
        { id: 1, ingredientId: 7, source: 'SALE', sourceId: 3, qty: -900 },
        { id: 2, ingredientId: 99, source: 'RESTOCK', sourceId: 4, qty: 1000 },
      ],
      ingredients: [{ id: 7, name: 'Susu UHT' }],
      soldItems: [{ saleId: 3, menuName: 'Kopi Kapal API', qty: 3 }],
    });

    expect(movements).toMatchObject([
      { ingredientName: 'Susu UHT', relatedNames: ['Kopi Kapal API x3'] },
      { ingredientName: 'Bahan #99', relatedNames: [] },
    ]);
  });
});
