import Dexie from 'dexie';

export const db = new Dexie('TakarDB');

db.version(1).stores({
  ingredients: '++id, name, category, currentStock, updatedAt',
  menus: '++id, name, category, isActive, updatedAt',
  recipes: '++id, menuId, ingredientId, [menuId+ingredientId]',
  sales: '++id, date, createdAt',
  saleItems: '++id, saleId, menuId',
  saleItemIngredients: '++id, saleItemId, ingredientId',
  stockMovements: '++id, ingredientId, type, source, createdAt',
  wasteRecords: '++id, date, wasteType, createdAt',
  stockCounts: '++id, ingredientId, createdAt',
  settings: '++id',
});

db.version(2).stores({
  ingredients: '++id, name, category, currentStock, updatedAt',
  menus: '++id, name, category, isActive, updatedAt',
  recipes: '++id, menuId, ingredientId, [menuId+ingredientId]',
  sales: '++id, date, createdAt',
  saleItems: '++id, saleId, menuId',
  saleItemIngredients: '++id, saleItemId, ingredientId',
  stockMovements: '++id, ingredientId, type, source, createdAt',
  wasteRecords: '++id, date, wasteType, createdAt',
  stockCounts: '++id, ingredientId, createdAt',
  settings: '++id',
  categories: '++id, name, type, [type+name]',
});

export default db;
