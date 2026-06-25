import db from '../db/db.js';

export async function listActiveMenus() {
  return db.menus.where('isActive').equals(true).sortBy('name');
}

export async function listMenus() {
  return db.menus.orderBy('name').toArray();
}

export async function createMenu(input) {
  const now = Date.now();
  return db.menus.add({
    name: input.name.trim(),
    category: input.category.trim(),
    sellingPrice: Number(input.sellingPrice) || 0,
    packagingCost: Number(input.packagingCost) || 0,
    utilityCost: Number(input.utilityCost) || 0,
    marketplaceCost: Number(input.marketplaceCost) || 0,
    otherCost: Number(input.otherCost) || 0,
    isActive: input.isActive ?? true,
    createdAt: now,
    updatedAt: now,
  });
}

export async function updateMenu(id, input) {
  return db.menus.update(Number(id), {
    ...input,
    updatedAt: Date.now(),
  });
}

export async function deactivateMenu(id) {
  return updateMenu(id, { isActive: false });
}

export async function deleteOrDeactivateMenu(id) {
  const menuId = Number(id);
  const saleCount = await db.saleItems.where('menuId').equals(menuId).count();

  if (saleCount > 0) {
    await deactivateMenu(menuId);
    return { mode: 'deactivated' };
  }

  await db.transaction('rw', db.menus, db.recipes, async () => {
    await db.recipes.where('menuId').equals(menuId).delete();
    await db.menus.delete(menuId);
  });

  return { mode: 'deleted' };
}
