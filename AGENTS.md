# AGENTS.md - Codex Project Instructions for Takar

This file is the repo-level instruction source for Codex. Read and follow it before changing code.

Companion references:
- `PRD-Takar-Inventory-HPP-UMKM-FB.md` for full product requirements.
- `design_handoff_takar/README.md` for design guidance.

## Project Summary

Takar is a local-first inventory and COGS/HPP tracker for small F&B businesses such as home coffee shops, drink booths, and small food stalls.

Core workflow:
1. The owner records ingredients.
2. The owner creates menus.
3. The owner builds recipes/BOM.
4. COGS/HPP is calculated automatically.
5. When a menu is sold, ingredient stock is deducted automatically from the recipe.
6. The app also supports waste records, stock counts, reports, and backup.

Takar is not a full POS or cashier system. Keep scope focused on stock tracking and real profit per menu.

Sample brand/data for seed and testing: `Latteva`.

Terminology:
- UI language is plain Indonesian.
- HPP means COGS or cost per portion.
- Code may use `hpp` or `cost`.
- User-facing copy should prefer "modal per porsi" where appropriate.

## Fixed Tech Stack

Do not change this stack unless the user explicitly asks:
- Vite + React with JavaScript.
- Tailwind CSS.
- Dexie.js for IndexedDB.
- `dexie-react-hooks` and `useLiveQuery` for reactive UI.
- `react-router-dom` for routing.
- Optional final-phase dependency: `xlsx` for Excel export.

Hard constraints:
- No backend.
- No API calls.
- No login.
- All data is local in the browser.
- Do not migrate this to Next.js.

## Language Rules

- Code, variable names, function names, filenames, and DB fields must be English.
- User-facing text must be Indonesian.
- Keep Indonesian UI text in `src/utils/labels.js` as a key-to-string dictionary.
- Components should import labels from `src/utils/labels.js`.
- Do not scatter hardcoded Indonesian strings across components.

Examples:
- Code: `currentStock`, `avgCostPerUnit`, `sellingPrice`, `saveSale()`, `ingredientService.js`.
- UI: "Stok saat ini", "Harga jual", "Simpan Penjualan".

## Architecture Rules

- All business logic and DB access must live in `src/services/`.
- React components should render UI, call services, and read data with `useLiveQuery`.
- Components must not write directly to Dexie.
- Any data change touching multiple tables must use `db.transaction()`.
- Use string enum constants from `src/db/enums.js`; do not use random magic strings.
- Use `Date.now()` numeric timestamps.
- Do not use `localStorage` or `sessionStorage` for core app data.
- Settings belong in the Dexie `settings` table.

## Core Stock and HPP Rules

These rules are business-critical.

- One ingredient has exactly one base unit: `gram`, `ml`, or `pcs`.
- Recipes must use the ingredient unit.
- Recipe unit is read-only in the UI and follows the selected ingredient.
- No unit conversion in the MVP.
- On restock, update `avgCostPerUnit` with moving weighted average.
- COGS/HPP per menu is the sum of `recipe.qty * ingredient.avgCostPerUnit`.
- Sales must snapshot prices, quantities, recipe usage, and costs at sale time.
- Changing recipe or menu price must not change past transactions.
- Stock may go negative.
- If stock is insufficient during sale, show a warning and allow either:
  - "Tetap simpan" to proceed and allow negative stock.
  - "Batal" to cancel.
- `stockMovements` is the source of truth for stock audit.
- Every stock change must write a `stockMovements` row with `stockBefore` and `stockAfter`.

## Backup Rules

- Support JSON export containing all tables.
- Support JSON import with a clear confirmation that import overwrites current data.
- Show a backup reminder on the dashboard because browser data can be lost.

## MVP Scope Guard

Do not build these in the MVP:
- Multi-branch.
- Login or multi-user.
- Complex roles.
- QRIS.
- Marketplace integrations such as Grab or GoFood.
- Barcode scanner.
- Supplier management.
- Per-batch expiry.
- Payroll.
- Full accounting.
- Cloud sync.
- Unit conversion.
- Recipe variants or bundling.

If a requested feature is ambiguous, default to out of scope and ask before implementing.

## Dexie Schema v1

Use this schema in `src/db/db.js`:

```js
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

Fields:
- `ingredients`: `id`, `name`, `category`, `unit`, `currentStock`, `minStock`, `avgCostPerUnit`, `lastPurchasePrice`, `note`, `createdAt`, `updatedAt`
- `menus`: `id`, `name`, `category`, `sellingPrice`, `isActive`, `createdAt`, `updatedAt`
- `recipes`: `id`, `menuId`, `ingredientId`, `qty`, `unit`
- `sales`: `id`, `date`, `totalAmount`, `totalHpp`, `grossProfit`, `note`, `createdAt`
- `saleItems`: `id`, `saleId`, `menuId`, `menuName`, `qty`, `priceAtSale`, `subtotal`, `hppAtSale`, `profitAtSale`
- `saleItemIngredients`: `id`, `saleItemId`, `ingredientId`, `ingredientName`, `qtyUsed`, `unit`, `costPerUnitAtSale`, `totalCost`
- `stockMovements`: `id`, `ingredientId`, `type`, `source`, `sourceId`, `qty`, `unit`, `stockBefore`, `stockAfter`, `note`, `createdAt`
- `wasteRecords`: `id`, `date`, `wasteType`, `menuId`, `ingredientId`, `qty`, `estimatedLoss`, `note`, `createdAt`
- `stockCounts`: `id`, `ingredientId`, `systemStock`, `actualStock`, `difference`, `unit`, `note`, `createdAt`
- `settings`: `id`, `storeName`, `currency`, `lowStockAlert`, `createdAt`, `updatedAt`

Enums in `src/db/enums.js`:

```js
export const MovementType = { IN: 'IN', OUT: 'OUT', WASTE: 'WASTE', ADJUST: 'ADJUST' };
export const MovementSource = {
  SALE: 'SALE',
  RESTOCK: 'RESTOCK',
  WASTE: 'WASTE',
  STOCK_COUNT: 'STOCK_COUNT',
  MANUAL_ADJUSTMENT: 'MANUAL_ADJUSTMENT',
};
export const WasteType = { MENU: 'MENU', INGREDIENT: 'INGREDIENT' };
export const Unit = { GRAM: 'gram', ML: 'ml', PCS: 'pcs' };
```

## Required Logic

Stock status:

```txt
currentStock <= 0        -> "habis" or "minus" status, red
currentStock <= minStock -> "menipis", yellow
else                     -> "aman", green
```

Moving average cost on restock:

```txt
costPerUnitIn = purchaseTotalPrice / qtyIn
combinedStock = currentStock + qtyIn
newAvgCost = combinedStock > 0
  ? (currentStock * avgCostPerUnit + qtyIn * costPerUnitIn) / combinedStock
  : costPerUnitIn
```

Menu formulas:

```txt
hpp = sum(recipe.qty * ingredient.avgCostPerUnit)
profit = sellingPrice - hpp
marginPercent = profit / sellingPrice * 100
```

`saveSale` must be atomic and must:
1. Create `sales`.
2. Create `saleItems` with snapshot price and HPP.
3. Create `saleItemIngredients` with snapshot ingredient usage and cost.
4. Update `ingredients.currentStock`.
5. Create `stockMovements` rows with type `OUT` and source `SALE`.

See PRD section 9 for the fuller sale example.

## Expected Folder Structure

```txt
src/
├─ db/            db.js, enums.js, seed.js
├─ services/      ingredientService, menuService, recipeService, saleService,
│                 wasteService, stockCountService, reportService, backupService
├─ hooks/         useStockStatus.js
├─ components/    ui/ (Button, Input, Modal, Card, Badge, StatCard, QtyStepper)
│                 layout/ (AppShell, BottomNav, TopBar)
│                 ingredients/ menus/ sales/ waste/ dashboard/
├─ pages/         Dashboard, Ingredients, Menus, Recipe, Sales, Restock,
│                 Waste, StockCount, Report, Settings
├─ utils/         labels.js, format.js, date.js
├─ App.jsx
├─ main.jsx
└─ index.css
```

Mobile bottom navigation:
- Dashboard
- Penjualan
- Bahan
- Laporan
- Lainnya

`Lainnya` should expose Menu, Resep, Restock, Waste, Stok Opname, and Pengaturan.

## Coding Standards

- Use React functional components and hooks.
- No class components.
- Use Tailwind CSS and the design handoff tokens.
- Keep status colors consistent: green, yellow, red.
- Button tap targets should be at least 48px.
- Mobile-first layout.
- Format Rupiah as rounded integer, for example `Rp 18.000`.
- Quantities may display up to 2 decimals.
- Store raw numbers; round only for display.
- Comments may be Indonesian, but keep them short and useful.
- Seed Latteva test data in `src/db/seed.js`: about 8 ingredients, 6 menus, and recipes for each menu.

## Build Order

Follow this order unless the user explicitly redirects:
1. Setup Vite, React, Tailwind, Router, Dexie, `db.js`, `enums.js`, `seed.js`, `AppShell`, and `BottomNav`.
2. Ingredients: service CRUD, restock, moving average, list page, status badge, form, and Restock page.
3. Menus: service, page, and form.
4. Recipes and COGS: service CRUD, `calcHpp`, and Recipe page with live COGS and profit.
5. Sales: atomic `saveSale`, snapshots, stock movements, Sales page, grid/cart, quantity stepper, insufficient stock warning.
6. Waste and Stock Count.
7. Dashboard, Report, Backup, and Settings.
8. Polish: PWA, search/filter, QA edge cases.

Build services and database foundations before UI.

## Edge Cases

Handle these deliberately:
- Menu sold without recipe: flag "resep belum dibuat", HPP is 0, require confirmation before selling.
- Insufficient stock: warn and allow proceed or cancel.
- Recipe and price changes: past transactions stay unchanged due to snapshots.
- Deleting an ingredient used in a recipe: warn first.
- Deleting a menu with transactions: deactivate with `isActive = false`; do not remove it from old reports.
- Negative stock: red status, nudge the user to run stock count.
- Browser data loss risk: show backup reminder.
- Floating point: round only on display.

## Definition of Done for MVP

The MVP is done when the user can:
- Add ingredients.
- Restock ingredients with correct moving-average cost.
- Create menus and recipes.
- See COGS/HPP and profit automatically.
- Sell menu items and deduct ingredient stock exactly according to recipe.
- Record waste.
- Run stock count.
- View daily dashboard and reports.
- Export and import JSON backup.

Everything must run well on a phone, with no backend, atomic transactions, and immutable historical sale snapshots.
