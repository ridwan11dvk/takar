import db from '../db/db.js';
import { MovementSource, MovementType, WasteType } from '../db/enums.js';
import {
  calculateIngredientWasteDraft,
  calculateMenuWasteDraft,
} from '../domain/inventory.js';
import { today } from '../utils/date.js';

export async function getWasteEntryData() {
  const [menus, recipes, ingredients] = await Promise.all([
    db.menus.toArray(),
    db.recipes.toArray(),
    db.ingredients.toArray(),
  ]);

  return {
    menus: menus.filter((menu) => menu.isActive),
    recipes,
    ingredients,
  };
}

export async function listWasteRecords() {
  return db.wasteRecords.orderBy('createdAt').reverse().toArray();
}

export async function saveIngredientWaste({
  ingredientId,
  qty,
  date = today(),
  note = '',
}) {
  return db.transaction('rw', db.ingredients, db.wasteRecords, db.stockMovements, async () => {
    const ingredient = await db.ingredients.get(Number(ingredientId));
    if (!ingredient) throw new Error('Ingredient not found');

    const draft = calculateIngredientWasteDraft({ ingredient, qty: Number(qty) });
    const now = Date.now();
    const wasteId = await db.wasteRecords.add({
      date,
      wasteType: WasteType.INGREDIENT,
      menuId: null,
      ingredientId: ingredient.id,
      qty: draft.qtyUsed,
      estimatedLoss: draft.estimatedLoss,
      note,
      createdAt: now,
    });

    await db.ingredients.update(ingredient.id, {
      currentStock: draft.stockAfter,
      updatedAt: now,
    });

    await db.stockMovements.add({
      ingredientId: ingredient.id,
      type: MovementType.WASTE,
      source: MovementSource.WASTE,
      sourceId: wasteId,
      qty: -draft.qtyUsed,
      unit: draft.unit,
      stockBefore: draft.stockBefore,
      stockAfter: draft.stockAfter,
      note: note || 'Waste bahan',
      createdAt: now,
    });

    return { wasteId, draft };
  });
}

export async function saveMenuWaste({ menuId, qty, date = today(), note = '' }) {
  return db.transaction(
    'rw',
    db.ingredients,
    db.menus,
    db.recipes,
    db.wasteRecords,
    db.stockMovements,
    async () => {
      const [menus, recipes, ingredients] = await Promise.all([
        db.menus.toArray(),
        db.recipes.toArray(),
        db.ingredients.toArray(),
      ]);
      const draft = calculateMenuWasteDraft({
        menuId: Number(menuId),
        qty: Number(qty),
        menus,
        recipes,
        ingredients,
      });
      const now = Date.now();
      const wasteId = await db.wasteRecords.add({
        date,
        wasteType: WasteType.MENU,
        menuId: draft.menuId,
        ingredientId: null,
        qty: draft.qty,
        estimatedLoss: draft.estimatedLoss,
        note,
        createdAt: now,
      });

      for (const usage of draft.ingredientUsages) {
        await db.ingredients.update(usage.ingredientId, {
          currentStock: usage.stockAfter,
          updatedAt: now,
        });
        await db.stockMovements.add({
          ingredientId: usage.ingredientId,
          type: MovementType.WASTE,
          source: MovementSource.WASTE,
          sourceId: wasteId,
          qty: -usage.qtyUsed,
          unit: usage.unit,
          stockBefore: usage.stockBefore,
          stockAfter: usage.stockAfter,
          note: note || `Waste ${draft.menuName}`,
          createdAt: now,
        });
      }

      return { wasteId, draft };
    },
  );
}
