# CLAUDE.md — Project Spec & Rules for "Takar"

> This file is the **source of truth** for the project. Read and follow it before writing any code.
> Companion docs: `PRD-Takar-Inventory-HPP-UMKM-FB.md` (product detail) & `README.md` (design) inside folder design_handoff_takar.

---

## 1. What is this?

**Takar** is an **inventory & COGS (HPP) tracker** web app for small F&B businesses (home-based coffee shops, drink booths, small food stalls). The owner records ingredients → creates menus → builds recipes (BOM) → COGS is calculated automatically → when a menu is sold, ingredient stock is deducted automatically based on the recipe. It also handles waste, stock counts (opname), reports, and backup.

**This is NOT a full POS/cashier app.** Focus: track stock & know the real profit per menu. Sample brand for seed/testing: **Latteva**.

Note on terminology: in the UI we use plain Indonesian. "HPP" (Harga Pokok Penjualan) = COGS / cost per portion. This file uses `hpp` / `cost` in code and "modal per porsi" in user-facing text.

---

## 2. Tech Stack (final — do not change)

- **Vite + React** (JavaScript). **NOT Next.js** — there is no backend/SSR, so Next.js only adds complexity.
- **Tailwind CSS** for styling.
- **Dexie.js** (`dexie`) for IndexedDB.
- **dexie-react-hooks** (`useLiveQuery`) for reactive UI.
- **react-router-dom** for routing.
- (Optional, final phase) `xlsx` for Excel export.

**No backend. No API calls. No login. All data is local in the browser.**

---

## 3. MANDATORY Rules (do not break)

### 3.1 Language
- **All code, variable names, functions, files, and DB fields = English.** Example: `currentStock`, `avgCostPerUnit`, `sellingPrice`, `saveSale()`, `ingredientService.js`.
- **All user-facing text = Indonesian.** Example labels: "Stok saat ini", "Harga jual", "Simpan Penjualan".
- Keep all Indonesian UI text in **one dictionary file** `src/utils/labels.js` (a key→string object). Components import from it. DO NOT hardcode Indonesian strings scattered across components.

### 3.2 Architecture
- **All business logic & DB access lives in `src/services/`.** Components MUST NOT write to Dexie directly.
- Components only: render + call a service + read data via `useLiveQuery`.
- Any data change that touches multiple tables MUST be wrapped in `db.transaction()` (atomic).

### 3.3 Stock & COGS (core logic — must be correct)
- **One ingredient = one base unit** (`'gram' | 'ml' | 'pcs'`). **Recipes MUST use the ingredient's unit** (the recipe unit follows the ingredient, read-only in the UI). **NO unit conversion** in the MVP.
- **Moving average cost**: on every restock, `avgCostPerUnit` is updated using a weighted average, NOT overwritten outright. (Formula in §6.)
- **COGS per menu** = Σ(`recipe.qty` × `ingredient.avgCostPerUnit`).
- **Snapshot on sale**: `saleItems` & `saleItemIngredients` store the price/qty/cost at sale time. Consequence: **changing a recipe/price MUST NOT change past transactions.**
- **Stock may go NEGATIVE.** When selling and stock is insufficient → **show a warning, DO NOT hard-block.** The user may choose "Tetap simpan" (proceed, stock goes negative and is flagged red) or "Batal".
- **`stockMovements` is the single source of truth** for stock audit. Every stock change (sale/restock/waste/opname/adjust) MUST write one row here with `stockBefore` & `stockAfter`.

### 3.4 Backup
- Must support **export to JSON** (all tables) and **import from JSON** (with a confirmation: "this will overwrite your data").
- Show a backup reminder on the dashboard (data can be lost if the browser is cleared).

---

## 4. Scope Guard — DO NOT build in the MVP

Multi-branch · login/multi-user · complex roles · QRIS · marketplaces (Grab/GoFood) · barcode scanner · supplier management · per-batch expiry · payroll · full accounting · **cloud sync** · unit conversion · recipe variants/bundling.

If unsure whether a feature is in scope → **default: NO**, and ask first.

---

## 5. Database Schema (Dexie v1)

```js
// src/db/db.js
import Dexie from 'dexie';

export const db = new Dexie('TakarDB');

db.version(1).stores({
  ingredients:         '++id, name, category, currentStock, updatedAt',
  menus:               '++id, name, category, isActive, updatedAt',
  recipes:             '++id, menuId, ingredientId, [menuId+ingredientId]',
  sales:               '++id, date, createdAt',
  saleItems:           '++id, saleId, menuId',
  saleItemIngredients: '++id, saleItemId, ingredientId',
  stockMovements:      '++id, ingredientId, type, source, createdAt',
  wasteRecords:        '++id, date, wasteType, createdAt',
  stockCounts:         '++id, ingredientId, createdAt',
  settings:            '++id',
});

export default db;
```

### Fields per table (all names in English)
- **ingredients**: id, name, category, unit(`gram|ml|pcs`), currentStock, minStock, avgCostPerUnit, lastPurchasePrice, note, createdAt, updatedAt
- **menus**: id, name, category, sellingPrice, isActive(bool), createdAt, updatedAt
- **recipes**: id, menuId, ingredientId, qty, unit
- **sales**: id, date(`YYYY-MM-DD`), totalAmount, totalHpp, grossProfit, note, createdAt
- **saleItems**: id, saleId, menuId, menuName, qty, priceAtSale, subtotal, hppAtSale, profitAtSale
- **saleItemIngredients**: id, saleItemId, ingredientId, ingredientName, qtyUsed, unit, costPerUnitAtSale, totalCost
- **stockMovements**: id, ingredientId, type, source, sourceId, qty(can be negative), unit, stockBefore, stockAfter, note, createdAt
- **wasteRecords**: id, date, wasteType(`MENU|INGREDIENT`), menuId|null, ingredientId|null, qty, estimatedLoss, note, createdAt
- **stockCounts**: id, ingredientId, systemStock, actualStock, difference, unit, note, createdAt
- **settings**: id(always 1), storeName, currency, lowStockAlert(bool), createdAt, updatedAt

### Enums (use string constants, no random magic strings)
```js
// src/db/enums.js
export const MovementType = { IN:'IN', OUT:'OUT', WASTE:'WASTE', ADJUST:'ADJUST' };
export const MovementSource = {
  SALE:'SALE', RESTOCK:'RESTOCK', WASTE:'WASTE',
  STOCK_COUNT:'STOCK_COUNT', MANUAL_ADJUSTMENT:'MANUAL_ADJUSTMENT',
};
export const WasteType = { MENU:'MENU', INGREDIENT:'INGREDIENT' };
export const Unit = { GRAM:'gram', ML:'ml', PCS:'pcs' };
```

---

## 6. Key Formulas & Logic (implement exactly)

**Stock status** (for the badge):
```
currentStock <= 0           -> "habis" (red)    // includes negative
currentStock <= minStock    -> "menipis" (yellow)
else                        -> "aman" (green)
```

**Moving average cost on restock** (`qtyIn` added, `purchaseTotalPrice` total purchase price):
```
costPerUnitIn = purchaseTotalPrice / qtyIn
combinedStock = currentStock + qtyIn
newAvgCost = combinedStock > 0
  ? (currentStock * avgCostPerUnit + qtyIn * costPerUnitIn) / combinedStock
  : costPerUnitIn
```

**COGS per menu** = Σ(`recipe.qty` × `ingredient.avgCostPerUnit`)
**Profit per menu** = `sellingPrice` − COGS · **Margin %** = profit / sellingPrice × 100

**saveSale** must be atomic and write: `sales` → `saleItems` (snapshot price+hpp) → `saleItemIngredients` (snapshot qty+cost) → update `ingredients.currentStock` → `stockMovements` (type OUT, source SALE). See the full example in PRD §9.

---

## 7. Folder Structure

```
src/
├─ db/            db.js, enums.js, seed.js
├─ services/      ingredientService, menuService, recipeService, saleService,
│                 wasteService, stockCountService, reportService, backupService
├─ hooks/         useStockStatus.js (+ a useLiveQuery helper if needed)
├─ components/    ui/ (Button, Input, Modal, Card, Badge, StatCard, QtyStepper)
│                 layout/ (AppShell, BottomNav, TopBar)
│                 ingredients/ menus/ sales/ waste/ dashboard/
├─ pages/         Dashboard, Ingredients, Menus, Recipe, Sales, Restock,
│                 Waste, StockCount, Report, Settings
├─ utils/         labels.js (Indonesian UI text), format.js (formatRupiah, formatQty), date.js (today())
├─ App.jsx        routing + AppShell
├─ main.jsx
└─ index.css      Tailwind
```

Navigation (mobile bottom nav): **Dashboard · Penjualan · Bahan · Laporan · Lainnya** ("Lainnya" → Menu, Resep, Restock, Waste, Stok Opname, Pengaturan).

---

## 8. Coding Standards

- React functional components + hooks. No class components.
- **DO NOT use `localStorage`/`sessionStorage`** for core data — everything goes through Dexie. (Settings live in the `settings` table.)
- Number formatting: Rupiah shown as a rounded integer (`Rp 18.000`); qty may have up to 2 decimals. Store raw numbers; round only on display.
- Use `Date.now()` (number) for timestamps.
- Tailwind: use the design tokens from the Claude Design output (status colors green/yellow/red kept consistent). Buttons tap target ≥ 48px, mobile-first.
- Comments may be in Indonesian, but keep them short.
- Write Latteva seed data (`seed.js`) for testing: ~8 ingredients, 6 menus, a recipe per menu.

---

## 9. Build Order (follow this)

1. **Setup**: Vite + React + Tailwind + Router + Dexie. Create `db.js`, `enums.js`, `seed.js`, AppShell + BottomNav.
2. **Ingredients**: service (CRUD + restock + moving avg) → IngredientsPage (list + badge) → form → RestockPage.
3. **Menus**: service + page + form.
4. **Recipe/COGS**: service (CRUD + calcHpp) → RecipePage (live COGS & profit).
5. **Sales** (most critical): atomic `saveSale` + snapshot + stockMovement → SalesPage (grid + cart + qty stepper + insufficient-stock warning).
6. **Waste** (ingredient & menu modes) → **StockCount** (opname).
7. **Dashboard** + **Report** + **Backup** (JSON export/import) + **Settings**.
8. Polish: PWA, search/filter, QA edge cases.

**Start now from step 1, then build `db.js` + services before any UI.**

---

## 10. Edge Cases to handle (summary)

- Menu sold without a recipe → flag "resep belum dibuat", COGS=0, confirm before selling.
- Insufficient stock → warning (may proceed, stock goes negative), not a hard block.
- Price/recipe changes → past transactions stay correct because of snapshots.
- Deleting an ingredient used in a recipe → warn first.
- Deleting a menu that has transactions → just deactivate it (`isActive=false`), don't remove it from old reports.
- Negative stock → red "Minus" badge, nudge the user to do a stock count.
- Browser data can be lost → show a backup reminder.
- Floating point → round only on display.

---

## 11. Definition of Done (MVP)

The user can: add ingredients + restock (correct moving-average cost) → create menus + recipes → see COGS & profit automatically → sell a menu and have ingredient stock decrease exactly per the recipe → record waste & do a stock count → view a daily dashboard & report → export/import a JSON backup. Everything runs on a phone, with no backend, atomic transactions, and past transactions unchanged when recipes/prices are edited later.
