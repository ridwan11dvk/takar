import { getStockStatus } from '../domain/inventory.js';

export function useStockStatus(ingredient) {
  return getStockStatus({
    currentStock: ingredient.currentStock,
    minStock: ingredient.minStock,
  });
}
