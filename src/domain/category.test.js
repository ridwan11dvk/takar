import { describe, expect, it } from 'vitest';
import {
  chooseReplacementCategoryName,
  defaultIngredientCategories,
  defaultMenuCategories,
  normalizeCategoryName,
} from './category.js';

describe('category domain helpers', () => {
  it('normalizes category names before saving', () => {
    expect(normalizeCategoryName('  bahan kering  ')).toBe('Bahan kering');
    expect(normalizeCategoryName('')).toBe('');
  });

  it('defines default categories for ingredients and menus', () => {
    expect(defaultIngredientCategories).toEqual(['Kopi', 'Dairy', 'Kemasan', 'Makanan']);
    expect(defaultMenuCategories).toEqual(['Minuman', 'Makanan']);
  });

  it('chooses a safe replacement category when deleting a category in use', () => {
    expect(chooseReplacementCategoryName({
      deletedName: 'Dairy',
      categories: ['Kopi', 'Dairy', 'Kemasan'],
    })).toBe('Kopi');

    expect(chooseReplacementCategoryName({
      deletedName: 'Dairy',
      categories: ['Dairy'],
    })).toBe('Lainnya');
  });
});
