import db from '../db/db.js';
import { MovementSource, MovementType } from '../db/enums.js';
import { calculateRestockAverage } from '../domain/inventory.js';

export async function listIngredients() {
  return db.ingredients.orderBy('name').toArray();
}

export async function getIngredient(id) {
  return db.ingredients.get(Number(id));
}

export async function createIngredient(input) {
  const now = Date.now();
  return db.ingredients.add({
    name: input.name.trim(),
    category: input.category.trim(),
    unit: input.unit,
    currentStock: Number(input.currentStock) || 0,
    minStock: Number(input.minStock) || 0,
    avgCostPerUnit: Number(input.avgCostPerUnit) || 0,
    lastPurchasePrice: Number(input.lastPurchasePrice) || 0,
    note: input.note?.trim() ?? '',
    createdAt: now,
    updatedAt: now,
  });
}

export async function updateIngredient(id, input) {
  return db.ingredients.update(Number(id), {
    name: input.name?.trim(),
    category: input.category?.trim(),
    unit: input.unit,
    currentStock: Number(input.currentStock) || 0,
    minStock: Number(input.minStock) || 0,
    avgCostPerUnit: Number(input.avgCostPerUnit) || 0,
    lastPurchasePrice: Number(input.lastPurchasePrice) || 0,
    note: input.note?.trim() ?? '',
    updatedAt: Date.now(),
  });
}

export async function deleteIngredientSafely(id) {
  const ingredientId = Number(id);
  const recipeCount = await db.recipes.where('ingredientId').equals(ingredientId).count();

  if (recipeCount > 0) {
    return { ok: false, reason: 'USED_IN_RECIPE' };
  }

  await db.ingredients.delete(ingredientId);
  return { ok: true };
}

export async function restockIngredient({ ingredientId, qtyIn, purchaseTotalPrice, note = '' }) {
  return db.transaction('rw', db.ingredients, db.stockMovements, async () => {
    const ingredient = await db.ingredients.get(Number(ingredientId));
    if (!ingredient) throw new Error('Ingredient not found');

    const qty = Number(qtyIn);
    const purchaseTotal = Number(purchaseTotalPrice);
    const { costPerUnitIn, combinedStock, newAvgCost } = calculateRestockAverage({
      currentStock: ingredient.currentStock,
      avgCostPerUnit: ingredient.avgCostPerUnit,
      qtyIn: qty,
      purchaseTotalPrice: purchaseTotal,
    });

    const now = Date.now();
    await db.ingredients.update(ingredient.id, {
      currentStock: combinedStock,
      avgCostPerUnit: newAvgCost,
      lastPurchasePrice: purchaseTotal,
      updatedAt: now,
    });

    await db.stockMovements.add({
      ingredientId: ingredient.id,
      type: MovementType.IN,
      source: MovementSource.RESTOCK,
      sourceId: null,
      qty,
      unit: ingredient.unit,
      stockBefore: ingredient.currentStock,
      stockAfter: combinedStock,
      note: note || `Restock @ ${costPerUnitIn}`,
      createdAt: now,
    });
  });
}
