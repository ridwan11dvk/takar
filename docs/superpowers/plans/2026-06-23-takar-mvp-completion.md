# Takar MVP Completion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the local-first MVP beyond the first slice: menu CRUD, recipe editing, waste, stock count, reports, settings, and JSON import/export UI.

**Architecture:** Keep calculations in `src/domain/inventory.js`, persistence in `src/services/`, and UI pages as thin callers through `useLiveQuery`. All multi-table stock changes use Dexie transactions and write `stockMovements`.

**Tech Stack:** Vite, React JavaScript, Tailwind CSS, Dexie, dexie-react-hooks, React Router, Vitest.

---

### Task 1: Domain Logic for Waste and Stock Count

**Files:**
- Modify: `src/domain/inventory.test.js`
- Modify: `src/domain/inventory.js`

- [ ] Add failing tests for menu waste ingredient usage and stock-count adjustment.
- [ ] Run `pnpm test -- --run src/domain/inventory.test.js` and verify RED.
- [ ] Add `calculateMenuWasteDraft`, `calculateIngredientWasteDraft`, and `calculateStockCountDraft`.
- [ ] Run `pnpm test -- --run src/domain/inventory.test.js` and verify GREEN.

### Task 2: Remaining Services

**Files:**
- Create: `src/services/wasteService.js`
- Create: `src/services/stockCountService.js`
- Create: `src/services/settingsService.js`
- Modify: `src/services/reportService.js`
- Modify: `src/services/backupService.js`
- Modify: `src/services/menuService.js`

- [ ] Implement waste transactions for ingredient and menu modes.
- [ ] Implement stock count adjustment transactions.
- [ ] Implement settings get/update.
- [ ] Add report helpers for sales, stock movements, waste, and low-stock data.
- [ ] Keep backup import/export over all Dexie tables.
- [ ] Support hard menu delete only if there are no sale items; otherwise deactivate.

### Task 3: Form Components and Labels

**Files:**
- Modify: `src/utils/labels.js`
- Create: `src/components/ui/TextInput.jsx`
- Create: `src/components/ui/SelectInput.jsx`

- [ ] Add Indonesian UI labels for all MVP pages.
- [ ] Add reusable input/select controls to reduce page duplication.

### Task 4: CRUD and Workflow Pages

**Files:**
- Create: `src/pages/Menus.jsx`
- Create: `src/pages/Recipe.jsx`
- Create: `src/pages/Restock.jsx`
- Create: `src/pages/Waste.jsx`
- Create: `src/pages/StockCount.jsx`
- Create: `src/pages/Report.jsx`
- Create: `src/pages/Settings.jsx`
- Modify: `src/pages/Ingredients.jsx`
- Modify: `src/pages/More.jsx`
- Modify: `src/App.jsx`

- [ ] Build menu CRUD page with deactivate/delete behavior.
- [ ] Build recipe editor with live HPP/profit per selected menu.
- [ ] Build restock page for full restock entry.
- [ ] Build waste page with ingredient and menu modes.
- [ ] Build stock count page with actual-stock adjustment.
- [ ] Build report page with sales, profit, waste, low stock, and movement audit.
- [ ] Build settings page with store name and JSON import/export backup.
- [ ] Wire all routes from `More`.

### Task 5: Verification

**Files:**
- All project files.

- [ ] Run `pnpm test -- --run`.
- [ ] Run `pnpm build`.
- [ ] Confirm dev server still serves the app.
