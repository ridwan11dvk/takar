# Takar — Local-first Inventory & HPP Tracker for Small F&B Businesses

Takar is a mobile-friendly web app for small food and beverage businesses to track ingredients, recipes, stock movement, COGS/HPP, gross profit, waste, stock counts, and local backups.

> **Tagline:** Takar bahanmu, jaga untungmu.

## Overview

Takar helps small F&B owners answer three practical questions:

1. **How much stock do I have right now?**
2. **How much does each menu item really cost to make?**
3. **Where did my ingredients go — sales, restock, waste, or stock correction?**

The app is intentionally **not** a full POS/cashier system. It focuses on inventory, recipes/BOM, HPP calculation, and profit visibility for small shops, home coffee businesses, booths, and food stalls.

## Live Demo

- Demo: [takar-three.vercel.app](https://takar-three.vercel.app)
- Data storage: local browser IndexedDB
- Backend: none
- Login: none

## Key Features

- **Dashboard ringkas** — daily sales, HPP, gross profit, low stock, and backup reminder
- **Bahan baku** — ingredient CRUD with unit, current stock, minimum stock, and average cost
- **Kategori** — editable ingredient and menu categories
- **Menu** — menu CRUD with selling price and active status
- **Resep / BOM** — define ingredients and quantities per menu
- **HPP otomatis** — menu cost is calculated from recipe quantity × ingredient average cost
- **Penjualan cepat** — record menu sales and deduct ingredient stock automatically
- **Stock movement audit** — every stock change writes an audit row with before/after stock
- **Restock** — increases stock and updates moving weighted average cost
- **Waste / gagal produksi** — record ingredient waste or failed menu production
- **Stok opname** — compare physical stock with system stock and create adjustments
- **Laporan** — sales, profit, waste, and stock movement summary
- **Backup JSON** — export/import all local data for migration or recovery

## Tech Stack

- **Vite + React**
- **JavaScript**
- **Tailwind CSS**
- **Dexie.js / IndexedDB**
- **dexie-react-hooks**
- **React Router**
- **Vitest + Testing Library**
- **Vercel** for static deployment

## Product Constraints

Takar is designed as a simple local-first MVP:

- No backend
- No API calls
- No login or multi-user system
- No cloud sync
- No payment integration
- No marketplace integration
- No unit conversion in the MVP

All core data stays in the user's browser. Users should export JSON backups regularly if they rely on the app for real business data.

## Core Business Rules

### HPP / COGS

```txt
hpp = sum(recipe.qty * ingredient.avgCostPerUnit)
profit = sellingPrice - hpp
marginPercent = profit / sellingPrice * 100
```

### Restock moving average cost

```txt
costPerUnitIn = purchaseTotalPrice / qtyIn
combinedStock = currentStock + qtyIn
newAvgCost = combinedStock > 0
  ? (currentStock * avgCostPerUnit + qtyIn * costPerUnitIn) / combinedStock
  : costPerUnitIn
```

### Sale transaction

When a sale is saved, Takar atomically:

1. Creates a sale record
2. Creates sale item snapshots
3. Saves ingredient usage snapshots
4. Deducts ingredient stock based on recipes
5. Writes stock movement audit rows

Past transactions keep their original price, HPP, and ingredient cost snapshots even if menu prices or recipes change later.

## Getting Started

### Requirements

- Node.js 20+
- npm

### Install

```bash
npm install
```

### Run locally

```bash
npm run dev
```

Open the local Vite URL shown in your terminal.

### Run tests

```bash
npm test
```

### Build

```bash
npm run build
```

## Project Structure

```txt
src/
├─ components/      UI and layout components
├─ db/              Dexie database schema, enums, and seed data
├─ domain/          Domain rules and helpers
├─ hooks/           React hooks
├─ pages/           App screens/routes
├─ services/        Business logic and Dexie access
├─ test/            Test setup
└─ utils/           Formatting, labels, and input helpers
```

Important project docs:

- [`PRD-Takar-Inventory-HPP-UMKM-FB.md`](./PRD-Takar-Inventory-HPP-UMKM-FB.md) — product requirements and business rules
- [`design_handoff_takar/`](./design_handoff_takar/) — design handoff and UI tokens
- [`AGENTS.md`](./AGENTS.md) — project architecture and implementation rules

## Development Notes

- User-facing copy is written in Indonesian.
- Business logic and database access live in `src/services/`.
- React components should not write directly to Dexie.
- Any multi-table data mutation should use `db.transaction()`.
- `stockMovements` is the source of truth for stock audit history.
- The app uses seed data for the sample brand **Latteva**.

## Status

MVP project for portfolio/demo purposes. The app is usable locally in the browser, but because data is local-only, regular JSON backup is strongly recommended.

## Author

Built by [Ridwan Bachtiar](https://github.com/ridwan11dvk).
