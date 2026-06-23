import db from '../db/db.js';
import {
  CategoryType,
  chooseReplacementCategoryName,
  defaultIngredientCategories,
  defaultMenuCategories,
  normalizeCategoryName,
} from '../domain/category.js';

export { CategoryType };

export async function ensureDefaultCategories() {
  if (!db.categories) return;

  const count = await db.categories.count();
  if (count > 0) return;

  await restoreDefaultCategories();
}

export async function restoreDefaultCategories() {
  if (!db.categories) return;

  const now = Date.now();
  const existing = await db.categories.toArray();
  const existingKeys = new Set(existing.map((category) => `${category.type}:${category.name}`));
  const defaults = [
    ...defaultIngredientCategories.map((name) => ({ name, type: CategoryType.INGREDIENT })),
    ...defaultMenuCategories.map((name) => ({ name, type: CategoryType.MENU })),
  ].filter((category) => !existingKeys.has(`${category.type}:${category.name}`));

  if (defaults.length === 0) return;

  await db.categories.bulkAdd(
    defaults.map((category) => ({
      ...category,
      createdAt: now,
      updatedAt: now,
    })),
  );
}

export async function listCategories(type) {
  try {
    if (!db.categories) return getDefaultCategoryRows(type);

    return db.categories.where('type').equals(type).sortBy('name');
  } catch (error) {
    console.error(error);
    return getDefaultCategoryRows(type);
  }
}

export async function createCategory({ name, type }) {
  if (!db.categories) throw new Error('Categories table is not ready');

  const normalizedName = normalizeCategoryName(name);
  if (!normalizedName) throw new Error('Category name is required');

  const now = Date.now();
  const existing = await db.categories
    .where('[type+name]')
    .equals([type, normalizedName])
    .first();

  if (existing) return existing.id;

  return db.categories.add({
    name: normalizedName,
    type,
    createdAt: now,
    updatedAt: now,
  });
}

export async function updateCategory(id, { name }) {
  if (!db.categories) throw new Error('Categories table is not ready');

  const category = await resolveCategory(id);
  if (!category) return 0;

  const normalizedName = normalizeCategoryName(name);
  if (!normalizedName) throw new Error('Category name is required');
  if (normalizedName === category.name) return { ok: true, mode: 'unchanged' };

  const duplicate = await db.categories
    .where('[type+name]')
    .equals([category.type, normalizedName])
    .first();
  if (duplicate && duplicate.id !== category.id) {
    return { ok: false, reason: 'DUPLICATE' };
  }

  await db.transaction('rw', db.categories, db.ingredients, db.menus, async () => {
    const now = Date.now();
    await db.categories.update(category.id, {
      name: normalizedName,
      updatedAt: now,
    });

    if (category.type === CategoryType.INGREDIENT) {
      const ingredients = await db.ingredients.where('category').equals(category.name).toArray();
      await Promise.all(ingredients.map((ingredient) => db.ingredients.update(ingredient.id, {
        category: normalizedName,
        updatedAt: now,
      })));
    }

    if (category.type === CategoryType.MENU) {
      const menus = await db.menus.where('category').equals(category.name).toArray();
      await Promise.all(menus.map((menu) => db.menus.update(menu.id, {
        category: normalizedName,
        updatedAt: now,
      })));
    }
  });

  return { ok: true, mode: 'updated' };
}

export async function deleteCategory(id) {
  if (!db.categories) return { ok: false, reason: 'NOT_READY' };

  const category = await resolveCategory(id);
  if (!category) return { ok: true };

  const sameTypeCategories = await db.categories.where('type').equals(category.type).toArray();
  const replacementName = chooseReplacementCategoryName({
    deletedName: category.name,
    categories: sameTypeCategories.map((item) => item.name),
  });

  await db.transaction('rw', db.categories, db.ingredients, db.menus, async () => {
    const now = Date.now();

    if (!sameTypeCategories.some((item) => item.name === replacementName)) {
      await db.categories.add({
        name: replacementName,
        type: category.type,
        createdAt: now,
        updatedAt: now,
      });
    }

    if (category.type === CategoryType.INGREDIENT) {
      const ingredients = await db.ingredients.where('category').equals(category.name).toArray();
      await Promise.all(ingredients.map((ingredient) => db.ingredients.update(ingredient.id, {
        category: replacementName,
        updatedAt: now,
      })));
    }

    if (category.type === CategoryType.MENU) {
      const menus = await db.menus.where('category').equals(category.name).toArray();
      await Promise.all(menus.map((menu) => db.menus.update(menu.id, {
        category: replacementName,
        updatedAt: now,
      })));
    }

    await db.categories.delete(category.id);
  });

  return { ok: true, replacementName };
}

function getDefaultCategoryRows(type) {
  const names = type === CategoryType.INGREDIENT ? defaultIngredientCategories : defaultMenuCategories;
  return names.map((name, index) => ({
    id: `default-${type}-${index}`,
    name,
    type,
  }));
}

async function resolveCategory(id) {
  const numericId = Number(id);
  if (Number.isFinite(numericId)) {
    return db.categories.get(numericId);
  }

  const match = String(id).match(/^default-(INGREDIENT|MENU)-(\d+)$/);
  if (!match) return null;

  const type = match[1];
  const index = Number(match[2]);
  const names = type === CategoryType.INGREDIENT ? defaultIngredientCategories : defaultMenuCategories;
  const name = names[index];
  if (!name) return null;

  await createCategory({ name, type });
  return db.categories.where('[type+name]').equals([type, name]).first();
}
