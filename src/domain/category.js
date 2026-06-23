export const CategoryType = {
  INGREDIENT: 'INGREDIENT',
  MENU: 'MENU',
};

export const defaultIngredientCategories = ['Kopi', 'Dairy', 'Kemasan', 'Makanan'];
export const defaultMenuCategories = ['Minuman', 'Makanan'];

export function normalizeCategoryName(value) {
  const trimmed = String(value ?? '').trim();
  if (!trimmed) return '';

  return trimmed[0].toUpperCase() + trimmed.slice(1);
}

export function chooseReplacementCategoryName({ deletedName, categories }) {
  return categories.find((name) => name !== deletedName) ?? 'Lainnya';
}
