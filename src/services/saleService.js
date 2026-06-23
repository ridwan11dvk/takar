import db from '../db/db.js';
import { MovementSource, MovementType } from '../db/enums.js';
import { calculateSaleDraft } from '../domain/inventory.js';
import { today } from '../utils/date.js';

export async function previewSale(cart) {
  const data = await getSaleEntryData();

  return calculateSaleDraft({ cart, ...data });
}

export async function getSaleEntryData() {
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

export async function saveSale({ cart, date = today(), note = '' }) {
  return db.transaction(
    'rw',
    db.sales,
    db.saleItems,
    db.saleItemIngredients,
    db.ingredients,
    db.stockMovements,
    db.menus,
    db.recipes,
    async () => {
      const [menus, recipes, ingredients] = await Promise.all([
        db.menus.toArray(),
        db.recipes.toArray(),
        db.ingredients.toArray(),
      ]);
      const draft = calculateSaleDraft({ cart, menus, recipes, ingredients });
      const now = Date.now();

      const saleId = await db.sales.add({
        date,
        totalAmount: draft.totalAmount,
        totalHpp: draft.totalHpp,
        grossProfit: draft.grossProfit,
        note,
        createdAt: now,
      });

      for (const item of draft.items) {
        const saleItemId = await db.saleItems.add({
          saleId,
          menuId: item.menuId,
          menuName: item.menuName,
          qty: item.qty,
          priceAtSale: item.priceAtSale,
          subtotal: item.subtotal,
          hppAtSale: item.hppAtSale,
          profitAtSale: item.profitAtSale,
        });

        const itemRecipes = recipes.filter((recipe) => recipe.menuId === item.menuId);
        const snapshots = itemRecipes
          .map((recipe) => {
            const ingredient = ingredients.find((entry) => entry.id === recipe.ingredientId);
            if (!ingredient) return null;
            const qtyUsed = recipe.qty * item.qty;

            return {
              saleItemId,
              ingredientId: ingredient.id,
              ingredientName: ingredient.name,
              qtyUsed,
              unit: recipe.unit,
              costPerUnitAtSale: ingredient.avgCostPerUnit,
              totalCost: qtyUsed * ingredient.avgCostPerUnit,
            };
          })
          .filter(Boolean);

        if (snapshots.length > 0) {
          await db.saleItemIngredients.bulkAdd(snapshots);
        }
      }

      for (const usage of draft.ingredientUsages) {
        await db.ingredients.update(usage.ingredientId, {
          currentStock: usage.stockAfter,
          updatedAt: now,
        });
        await db.stockMovements.add({
          ingredientId: usage.ingredientId,
          type: MovementType.OUT,
          source: MovementSource.SALE,
          sourceId: saleId,
          qty: -usage.qtyUsed,
          unit: usage.unit,
          stockBefore: usage.stockBefore,
          stockAfter: usage.stockAfter,
          note: `Penjualan #${saleId}`,
          createdAt: now,
        });
      }

      return { saleId, draft };
    },
  );
}
