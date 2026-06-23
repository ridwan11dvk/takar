import db from '../db/db.js';
import { calculateMenuHpp } from '../domain/inventory.js';

export async function listRecipesByMenu(menuId) {
  return db.recipes.where('menuId').equals(Number(menuId)).toArray();
}

export async function saveRecipe(menuId, rows) {
  const id = Number(menuId);

  return db.transaction('rw', db.recipes, db.ingredients, async () => {
    await db.recipes.where('menuId').equals(id).delete();

    const ingredients = await db.ingredients.bulkGet(rows.map((row) => Number(row.ingredientId)));
    const records = rows.map((row, index) => {
      const ingredient = ingredients[index];
      if (!ingredient) throw new Error(`Ingredient not found: ${row.ingredientId}`);

      return {
        menuId: id,
        ingredientId: ingredient.id,
        qty: Number(row.qty) || 0,
        unit: ingredient.unit,
      };
    });

    if (records.length > 0) {
      await db.recipes.bulkAdd(records);
    }
  });
}

export async function calcHpp(menuId) {
  const recipes = await listRecipesByMenu(menuId);
  const ingredients = await db.ingredients.bulkGet(recipes.map((recipe) => recipe.ingredientId));
  return calculateMenuHpp({ recipes, ingredients: ingredients.filter(Boolean) });
}

export async function getRecipeStatusByMenuIds(menuIds) {
  const recipes = await db.recipes.toArray();
  const menuIdSet = new Set(menuIds);
  const status = new Map(menuIds.map((id) => [id, false]));

  for (const recipe of recipes) {
    if (menuIdSet.has(recipe.menuId)) {
      status.set(recipe.menuId, true);
    }
  }

  return status;
}

export async function getRecipeEditorData() {
  const [menus, ingredients, recipes] = await Promise.all([
    db.menus.toArray(),
    db.ingredients.toArray(),
    db.recipes.toArray(),
  ]);

  return {
    menus: menus.filter((menu) => menu.isActive),
    ingredients: ingredients.sort((a, b) => a.name.localeCompare(b.name)),
    recipes,
  };
}
