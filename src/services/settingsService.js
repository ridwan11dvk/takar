import db from '../db/db.js';

// Nilai default settings. Tidak menyentuh DB.
const DEFAULT_SETTINGS = {
  id: 1,
  storeName: 'Latteva',
  currency: 'IDR',
  lowStockAlert: true,
};

// Read-only: aman dipakai di useLiveQuery (liveQuery jalan di transaksi read-only,
// jadi DILARANG menulis di sini). Kembalikan default kalau baris belum ada.
export async function getSettings() {
  const settings = await db.settings.get(1);
  return settings ?? { ...DEFAULT_SETTINGS };
}

// Tulis baris default kalau belum ada. Panggil dari useEffect/bootstrap, BUKAN liveQuery.
export async function ensureSettings() {
  const existing = await db.settings.get(1);
  if (existing) return existing;

  const now = Date.now();
  const defaults = { ...DEFAULT_SETTINGS, createdAt: now, updatedAt: now };
  await db.settings.put(defaults);
  return defaults;
}

export async function updateSettings(input) {
  const current = await ensureSettings();
  const next = {
    ...current,
    storeName: input.storeName?.trim() || current.storeName,
    currency: input.currency || current.currency,
    lowStockAlert: Boolean(input.lowStockAlert),
    updatedAt: Date.now(),
  };
  await db.settings.put(next);
  return next;
}
