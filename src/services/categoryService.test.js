import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import db from '../db/db.js';
import { CategoryType } from '../domain/category.js';
import {
  createCategory,
  deleteCategory,
  ensureDefaultCategories,
  listCategories,
  restoreDefaultCategories,
  updateCategory,
} from './categoryService.js';

async function resetDb() {
  if (db.isOpen()) db.close();
  await db.delete();
  await db.open();
}

describe('categoryService', () => {
  beforeEach(async () => {
    await resetDb();
  });

  afterEach(async () => {
    await resetDb();
    db.close();
  });

  it('adds a category without deleting existing categories', async () => {
    await ensureDefaultCategories();

    await createCategory({ name: 'Bahan kering', type: CategoryType.INGREDIENT });

    const names = (await listCategories(CategoryType.INGREDIENT)).map((category) => category.name);
    expect(names).toEqual(['Bahan kering', 'Dairy', 'Kemasan', 'Kopi', 'Makanan']);
  });

  it('renames one category and preserves the rest', async () => {
    await ensureDefaultCategories();
    const dairy = (await listCategories(CategoryType.INGREDIENT)).find((category) => category.name === 'Dairy');
    await db.ingredients.add({
      name: 'Susu UHT',
      category: 'Dairy',
      unit: 'ml',
      currentStock: 10,
      minStock: 1,
      avgCostPerUnit: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    const result = await updateCategory(dairy.id, { name: 'Susu' });

    expect(result).toEqual({ ok: true, mode: 'updated' });
    expect((await listCategories(CategoryType.INGREDIENT)).map((category) => category.name)).toEqual([
      'Kemasan',
      'Kopi',
      'Makanan',
      'Susu',
    ]);
    expect((await db.ingredients.toArray())[0].category).toBe('Susu');
  });

  it('deletes one category and moves related rows to a replacement', async () => {
    await ensureDefaultCategories();
    const dairy = (await listCategories(CategoryType.INGREDIENT)).find((category) => category.name === 'Dairy');
    await db.ingredients.add({
      name: 'Susu UHT',
      category: 'Dairy',
      unit: 'ml',
      currentStock: 10,
      minStock: 1,
      avgCostPerUnit: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    const result = await deleteCategory(dairy.id);

    expect(result).toEqual({ ok: true, replacementName: 'Kopi' });
    expect((await listCategories(CategoryType.INGREDIENT)).map((category) => category.name)).toEqual([
      'Kemasan',
      'Kopi',
      'Makanan',
    ]);
    expect((await db.ingredients.toArray())[0].category).toBe('Kopi');
  });

  it('rejects duplicate category names without deleting anything', async () => {
    await ensureDefaultCategories();
    const dairy = (await listCategories(CategoryType.INGREDIENT)).find((category) => category.name === 'Dairy');

    const result = await updateCategory(dairy.id, { name: 'Kopi' });

    expect(result).toEqual({ ok: false, reason: 'DUPLICATE' });
    expect((await listCategories(CategoryType.INGREDIENT)).map((category) => category.name)).toEqual([
      'Dairy',
      'Kemasan',
      'Kopi',
      'Makanan',
    ]);
  });

  it('restores missing default categories without deleting custom categories', async () => {
    await createCategory({ name: 'Bahan kering', type: CategoryType.INGREDIENT });

    await restoreDefaultCategories();

    expect((await listCategories(CategoryType.INGREDIENT)).map((category) => category.name)).toEqual([
      'Bahan kering',
      'Dairy',
      'Kemasan',
      'Kopi',
      'Makanan',
    ]);
  });
});
