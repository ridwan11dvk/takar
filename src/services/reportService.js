import db from '../db/db.js';
import { today } from '../utils/date.js';

export function enrichStockMovements({ stockMovements, ingredients, soldItems }) {
  const ingredientById = new Map(ingredients.map((ingredient) => [ingredient.id, ingredient]));
  const saleItemBySaleId = new Map();

  for (const item of soldItems) {
    const existing = saleItemBySaleId.get(item.saleId) ?? [];
    existing.push(item);
    saleItemBySaleId.set(item.saleId, existing);
  }

  return stockMovements.map((movement) => {
    const ingredient = ingredientById.get(movement.ingredientId);
    const relatedSaleItems = movement.source === 'SALE' ? saleItemBySaleId.get(movement.sourceId) ?? [] : [];

    return {
      ...movement,
      ingredientName: ingredient?.name ?? `Bahan #${movement.ingredientId}`,
      relatedNames: relatedSaleItems.map((item) => `${item.menuName} x${item.qty}`),
    };
  });
}

export async function getDashboardSummary(date = today()) {
  const [sales, saleItems, ingredients, wasteRecords] = await Promise.all([
    db.sales.where('date').equals(date).toArray(),
    db.saleItems.toArray(),
    db.ingredients.toArray(),
    db.wasteRecords.where('date').equals(date).toArray(),
  ]);

  const saleIds = new Set(sales.map((sale) => sale.id));
  const soldCount = saleItems
    .filter((item) => saleIds.has(item.saleId))
    .reduce((total, item) => total + item.qty, 0);

  return {
    todaySales: sales.reduce((total, sale) => total + sale.totalAmount, 0),
    grossProfit: sales.reduce((total, sale) => total + sale.grossProfit, 0),
    soldCount,
    wasteValue: wasteRecords.reduce((total, record) => total + (record.estimatedLoss ?? 0), 0),
    lowStock: ingredients.filter((ingredient) => ingredient.currentStock <= ingredient.minStock),
  };
}

export async function getReportSummary(date = today()) {
  const [sales, saleItems, wasteRecords, stockMovements, ingredients] = await Promise.all([
    db.sales.where('date').equals(date).toArray(),
    db.saleItems.toArray(),
    db.wasteRecords.where('date').equals(date).toArray(),
    db.stockMovements.orderBy('createdAt').reverse().limit(25).toArray(),
    db.ingredients.toArray(),
  ]);

  const saleIds = new Set(sales.map((sale) => sale.id));
  const soldItems = saleItems.filter((item) => saleIds.has(item.saleId));
  const enrichedMovements = enrichStockMovements({ stockMovements, ingredients, soldItems });
  const totalHpp = sales.reduce((total, sale) => total + sale.totalHpp, 0);
  const soldCount = soldItems.reduce((total, item) => total + item.qty, 0);

  return {
    date,
    sales,
    soldItems,
    todaySales: sales.reduce((total, sale) => total + sale.totalAmount, 0),
    totalHpp,
    averageHpp: soldCount > 0 ? totalHpp / soldCount : 0,
    grossProfit: sales.reduce((total, sale) => total + sale.grossProfit, 0),
    soldCount,
    wasteValue: wasteRecords.reduce((total, record) => total + (record.estimatedLoss ?? 0), 0),
    wasteRecords,
    stockMovements: enrichedMovements,
    lowStock: ingredients.filter((ingredient) => ingredient.currentStock <= ingredient.minStock),
  };
}
