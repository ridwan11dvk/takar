import { describe, expect, it } from 'vitest';
import {
  calculateIngredientWasteDraft,
  calculateMenuHpp,
  calculateMenuWasteDraft,
  calculateRestockAverage,
  calculateSaleDraft,
  calculateStockCountDraft,
  getStockStatus,
} from './inventory.js';

describe('inventory domain logic', () => {
  it('marks stock as minus, empty, low, or safe', () => {
    expect(getStockStatus({ currentStock: -40, minStock: 100 })).toEqual({
      key: 'minus',
      label: 'Minus',
      tone: 'danger',
    });
    expect(getStockStatus({ currentStock: 0, minStock: 100 })).toEqual({
      key: 'empty',
      label: 'Habis',
      tone: 'danger',
    });
    expect(getStockStatus({ currentStock: 80, minStock: 100 })).toEqual({
      key: 'low',
      label: 'Menipis',
      tone: 'warning',
    });
    expect(getStockStatus({ currentStock: 180, minStock: 100 })).toEqual({
      key: 'safe',
      label: 'Aman',
      tone: 'success',
    });
  });

  it('calculates moving average cost on restock', () => {
    expect(
      calculateRestockAverage({
        currentStock: 100,
        avgCostPerUnit: 20,
        qtyIn: 50,
        purchaseTotalPrice: 1500,
      }),
    ).toEqual({
      costPerUnitIn: 30,
      combinedStock: 150,
      newAvgCost: 23.333333333333332,
    });
  });

  it('uses incoming cost when combined stock is not positive', () => {
    expect(
      calculateRestockAverage({
        currentStock: -20,
        avgCostPerUnit: 10,
        qtyIn: 10,
        purchaseTotalPrice: 500,
      }).newAvgCost,
    ).toBe(50);
  });

  it('calculates HPP from recipe quantity and ingredient average cost', () => {
    const recipes = [
      { ingredientId: 1, qty: 180 },
      { ingredientId: 2, qty: 18 },
    ];
    const ingredients = [
      { id: 1, avgCostPerUnit: 18 },
      { id: 2, avgCostPerUnit: 120 },
    ];

    expect(calculateMenuHpp({ recipes, ingredients })).toBe(5400);
  });

  it('builds a sale draft with snapshots, totals, and stock warnings', () => {
    const menus = [
      { id: 1, name: 'Kopi Latte', sellingPrice: 18000 },
      { id: 2, name: 'Matcha Latte', sellingPrice: 20000 },
    ];
    const recipes = [
      { menuId: 1, ingredientId: 1, qty: 180, unit: 'ml' },
      { menuId: 1, ingredientId: 2, qty: 18, unit: 'gram' },
      { menuId: 2, ingredientId: 1, qty: 220, unit: 'ml' },
      { menuId: 2, ingredientId: 3, qty: 25, unit: 'gram' },
    ];
    const ingredients = [
      { id: 1, name: 'Susu UHT', currentStock: 300, unit: 'ml', avgCostPerUnit: 18 },
      { id: 2, name: 'Kopi arabica', currentStock: 100, unit: 'gram', avgCostPerUnit: 120 },
      { id: 3, name: 'Matcha powder', currentStock: 10, unit: 'gram', avgCostPerUnit: 160 },
    ];

    const draft = calculateSaleDraft({
      cart: [
        { menuId: 1, qty: 1 },
        { menuId: 2, qty: 1 },
      ],
      menus,
      recipes,
      ingredients,
    });

    expect(draft.totalAmount).toBe(38000);
    expect(draft.totalHpp).toBe(13360);
    expect(draft.grossProfit).toBe(24640);
    expect(draft.items).toMatchObject([
      { menuId: 1, menuName: 'Kopi Latte', qty: 1, priceAtSale: 18000, hppAtSale: 5400 },
      { menuId: 2, menuName: 'Matcha Latte', qty: 1, priceAtSale: 20000, hppAtSale: 7960 },
    ]);
    expect(draft.ingredientUsages).toMatchObject([
      { ingredientId: 1, ingredientName: 'Susu UHT', qtyUsed: 400, stockAfter: -100 },
      { ingredientId: 2, ingredientName: 'Kopi arabica', qtyUsed: 18, stockAfter: 82 },
      { ingredientId: 3, ingredientName: 'Matcha powder', qtyUsed: 25, stockAfter: -15 },
    ]);
    expect(draft.stockWarnings).toEqual([
      { ingredientId: 1, ingredientName: 'Susu UHT', shortage: 100, unit: 'ml' },
      { ingredientId: 3, ingredientName: 'Matcha powder', shortage: 15, unit: 'gram' },
    ]);
  });

  it('builds a menu waste draft from recipe usage', () => {
    const menus = [{ id: 1, name: 'Kopi Latte' }];
    const recipes = [
      { menuId: 1, ingredientId: 1, qty: 180, unit: 'ml' },
      { menuId: 1, ingredientId: 2, qty: 18, unit: 'gram' },
    ];
    const ingredients = [
      { id: 1, name: 'Susu UHT', currentStock: 500, unit: 'ml', avgCostPerUnit: 18 },
      { id: 2, name: 'Kopi arabica', currentStock: 100, unit: 'gram', avgCostPerUnit: 120 },
    ];

    const draft = calculateMenuWasteDraft({
      menuId: 1,
      qty: 2,
      menus,
      recipes,
      ingredients,
    });

    expect(draft.menuName).toBe('Kopi Latte');
    expect(draft.estimatedLoss).toBe(10800);
    expect(draft.ingredientUsages).toEqual([
      {
        ingredientId: 1,
        ingredientName: 'Susu UHT',
        qtyUsed: 360,
        unit: 'ml',
        costPerUnitAtWaste: 18,
        totalCost: 6480,
        stockBefore: 500,
        stockAfter: 140,
      },
      {
        ingredientId: 2,
        ingredientName: 'Kopi arabica',
        qtyUsed: 36,
        unit: 'gram',
        costPerUnitAtWaste: 120,
        totalCost: 4320,
        stockBefore: 100,
        stockAfter: 64,
      },
    ]);
  });

  it('builds an ingredient waste draft directly from one ingredient', () => {
    const ingredient = {
      id: 3,
      name: 'Sirup Vanilla',
      currentStock: 50,
      unit: 'ml',
      avgCostPerUnit: 75,
    };

    expect(calculateIngredientWasteDraft({ ingredient, qty: 80 })).toEqual({
      ingredientId: 3,
      ingredientName: 'Sirup Vanilla',
      qtyUsed: 80,
      unit: 'ml',
      costPerUnitAtWaste: 75,
      totalCost: 6000,
      stockBefore: 50,
      stockAfter: -30,
      estimatedLoss: 6000,
    });
  });

  it('builds a stock count draft with adjustment difference', () => {
    const ingredient = {
      id: 7,
      name: 'Cup',
      currentStock: 5,
      unit: 'pcs',
    };

    expect(calculateStockCountDraft({ ingredient, actualStock: 12 })).toEqual({
      ingredientId: 7,
      ingredientName: 'Cup',
      systemStock: 5,
      actualStock: 12,
      difference: 7,
      unit: 'pcs',
      stockBefore: 5,
      stockAfter: 12,
    });
  });
});
