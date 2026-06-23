import db from '../db/db.js';

const tableNames = [
  'ingredients',
  'menus',
  'recipes',
  'sales',
  'saleItems',
  'saleItemIngredients',
  'stockMovements',
  'wasteRecords',
  'stockCounts',
  'settings',
  'categories',
];

export async function exportBackup() {
  const data = {};

  for (const tableName of tableNames) {
    data[tableName] = await db[tableName].toArray();
  }

  return {
    app: 'Takar',
    version: 1,
    exportedAt: Date.now(),
    data,
  };
}

export async function importBackup(backup) {
  if (backup?.app !== 'Takar' || backup?.version !== 1 || !backup.data) {
    throw new Error('Invalid backup file');
  }

  await db.transaction('rw', tableNames.map((name) => db[name]), async () => {
    for (const tableName of tableNames) {
      await db[tableName].clear();
      await db[tableName].bulkPut(backup.data[tableName] ?? []);
    }
  });
}

export function downloadBackup(backup) {
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `takar-backup-${backup.exportedAt}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}
