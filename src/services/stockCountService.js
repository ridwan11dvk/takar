import db from '../db/db.js';
import { MovementSource, MovementType } from '../db/enums.js';
import { calculateStockCountDraft } from '../domain/inventory.js';

export async function listStockCounts() {
  return db.stockCounts.orderBy('createdAt').reverse().toArray();
}

export async function saveStockCount({ ingredientId, actualStock, note = '' }) {
  return db.transaction('rw', db.ingredients, db.stockCounts, db.stockMovements, async () => {
    const ingredient = await db.ingredients.get(Number(ingredientId));
    if (!ingredient) throw new Error('Ingredient not found');

    const draft = calculateStockCountDraft({ ingredient, actualStock: Number(actualStock) });
    const now = Date.now();
    const countId = await db.stockCounts.add({
      ingredientId: ingredient.id,
      systemStock: draft.systemStock,
      actualStock: draft.actualStock,
      difference: draft.difference,
      unit: draft.unit,
      note,
      createdAt: now,
    });

    await db.ingredients.update(ingredient.id, {
      currentStock: draft.stockAfter,
      updatedAt: now,
    });

    await db.stockMovements.add({
      ingredientId: ingredient.id,
      type: MovementType.ADJUST,
      source: MovementSource.STOCK_COUNT,
      sourceId: countId,
      qty: draft.difference,
      unit: draft.unit,
      stockBefore: draft.stockBefore,
      stockAfter: draft.stockAfter,
      note: note || 'Stok opname',
      createdAt: now,
    });

    return { countId, draft };
  });
}
