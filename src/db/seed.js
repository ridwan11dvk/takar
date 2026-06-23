import { Unit } from './enums.js';
import db from './db.js';
import { CategoryType, defaultIngredientCategories, defaultMenuCategories } from '../domain/category.js';

const now = Date.now();

export const seedIngredients = [
  {
    name: 'Susu UHT',
    category: 'Dairy',
    unit: Unit.ML,
    currentStock: 820,
    minStock: 300,
    avgCostPerUnit: 18,
    lastPurchasePrice: 18000,
    note: '',
  },
  {
    name: 'Kopi arabica',
    category: 'Kopi',
    unit: Unit.GRAM,
    currentStock: 80,
    minStock: 100,
    avgCostPerUnit: 120,
    lastPurchasePrice: 120000,
    note: '',
  },
  {
    name: 'Cup',
    category: 'Kemasan',
    unit: Unit.PCS,
    currentStock: 5,
    minStock: 20,
    avgCostPerUnit: 650,
    lastPurchasePrice: 65000,
    note: '',
  },
  {
    name: 'Es batu',
    category: 'Dairy',
    unit: Unit.GRAM,
    currentStock: 0,
    minStock: 500,
    avgCostPerUnit: 3,
    lastPurchasePrice: 15000,
    note: '',
  },
  {
    name: 'Gula',
    category: 'Dairy',
    unit: Unit.GRAM,
    currentStock: 1500,
    minStock: 500,
    avgCostPerUnit: 16,
    lastPurchasePrice: 16000,
    note: '',
  },
  {
    name: 'Macaroni',
    category: 'Makanan',
    unit: Unit.GRAM,
    currentStock: 300,
    minStock: 400,
    avgCostPerUnit: 35,
    lastPurchasePrice: 35000,
    note: '',
  },
  {
    name: 'Sirup Vanilla',
    category: 'Dairy',
    unit: Unit.ML,
    currentStock: -40,
    minStock: 100,
    avgCostPerUnit: 75,
    lastPurchasePrice: 75000,
    note: '',
  },
  {
    name: 'Roti tawar',
    category: 'Makanan',
    unit: Unit.PCS,
    currentStock: 22,
    minStock: 10,
    avgCostPerUnit: 1200,
    lastPurchasePrice: 24000,
    note: '',
  },
  {
    name: 'Matcha powder',
    category: 'Dairy',
    unit: Unit.GRAM,
    currentStock: 260,
    minStock: 100,
    avgCostPerUnit: 160,
    lastPurchasePrice: 160000,
    note: '',
  },
];

export const seedMenus = [
  { name: 'Kopi Latte', category: 'Minuman', sellingPrice: 18000, isActive: true },
  { name: 'Matcha Latte', category: 'Minuman', sellingPrice: 20000, isActive: true },
  { name: 'Es Teh', category: 'Minuman', sellingPrice: 10000, isActive: true },
  { name: 'Roti Bakar', category: 'Makanan', sellingPrice: 15000, isActive: true },
  { name: 'Spaghetti Bolognese', category: 'Makanan', sellingPrice: 25000, isActive: true },
  { name: 'Mac n Cheese', category: 'Makanan', sellingPrice: 22000, isActive: true },
];

const recipeByMenu = {
  'Kopi Latte': [
    ['Susu UHT', 180],
    ['Kopi arabica', 18],
    ['Cup', 1],
    ['Sirup Vanilla', 15],
  ],
  'Matcha Latte': [
    ['Susu UHT', 220],
    ['Matcha powder', 25],
    ['Cup', 1],
    ['Gula', 12],
  ],
  'Es Teh': [
    ['Gula', 20],
    ['Es batu', 120],
    ['Cup', 1],
  ],
  'Roti Bakar': [
    ['Roti tawar', 2],
    ['Gula', 10],
  ],
  'Mac n Cheese': [
    ['Macaroni', 120],
    ['Susu UHT', 80],
  ],
};

export async function seedDatabase() {
  const existing = await db.ingredients.count();
  if (existing > 0) return;

  await db.transaction(
    'rw',
    db.ingredients,
    db.menus,
    db.recipes,
    db.settings,
    db.categories,
    async () => {
      const ingredientIds = await db.ingredients.bulkAdd(
        seedIngredients.map((ingredient) => ({
          ...ingredient,
          createdAt: now,
          updatedAt: now,
        })),
        { allKeys: true },
      );
      const menuIds = await db.menus.bulkAdd(
        seedMenus.map((menu) => ({
          ...menu,
          createdAt: now,
          updatedAt: now,
        })),
        { allKeys: true },
      );

      const ingredientMap = new Map(seedIngredients.map((item, index) => [item.name, ingredientIds[index]]));
      const menuMap = new Map(seedMenus.map((item, index) => [item.name, menuIds[index]]));

      const recipeRecords = [];
      for (const [menuName, rows] of Object.entries(recipeByMenu)) {
        for (const [ingredientName, qty] of rows) {
          const ingredientId = ingredientMap.get(ingredientName);
          const ingredient = seedIngredients.find((item) => item.name === ingredientName);
          recipeRecords.push({
            menuId: menuMap.get(menuName),
            ingredientId,
            qty,
            unit: ingredient.unit,
          });
        }
      }

      if (recipeRecords.length > 0) {
        await db.recipes.bulkAdd(recipeRecords);
      }

      await db.settings.add({
        id: 1,
        storeName: 'Latteva',
        currency: 'IDR',
        lowStockAlert: true,
        createdAt: now,
        updatedAt: now,
      });

      const categoryCount = await db.categories.count();
      if (categoryCount === 0) {
        await db.categories.bulkAdd([
          ...defaultIngredientCategories.map((name) => ({
            name,
            type: CategoryType.INGREDIENT,
            createdAt: now,
            updatedAt: now,
          })),
          ...defaultMenuCategories.map((name) => ({
            name,
            type: CategoryType.MENU,
            createdAt: now,
            updatedAt: now,
          })),
        ]);
      }
    },
  );
}
