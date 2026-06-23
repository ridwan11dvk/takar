# Takar First Slice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first usable local-first Takar slice: project scaffold, tested stock/HPP business logic, Dexie services, seed data, and the Dashboard/Penjualan/Bahan screens.

**Architecture:** Keep business logic in small pure modules that can be tested without IndexedDB, then wrap persistence in Dexie services. React pages read with `useLiveQuery`, call services for writes, and use Indonesian labels from `src/utils/labels.js`.

**Tech Stack:** Vite, React JavaScript, Tailwind CSS, Dexie, dexie-react-hooks, React Router, Vitest, Testing Library.

---

### Task 1: Project Scaffold

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `vite.config.js`
- Create: `postcss.config.js`
- Create: `tailwind.config.js`
- Create: `src/main.jsx`
- Create: `src/App.jsx`
- Create: `src/index.css`

- [ ] Create the Vite/React/Tailwind/Vitest package setup.
- [ ] Add base app entry and route shell.
- [ ] Install dependencies with `pnpm install`.
- [ ] Run `pnpm test -- --run` and expect no test files or passing setup.

### Task 2: Pure Business Logic Tests

**Files:**
- Create: `src/domain/inventory.test.js`
- Create: `src/domain/inventory.js`

- [ ] Write failing tests for stock status, moving average restock, recipe HPP, sale ingredient requirements, and sale totals.
- [ ] Run `pnpm test -- --run src/domain/inventory.test.js` and verify failures are due to missing implementation.
- [ ] Implement pure functions in `inventory.js`.
- [ ] Run the same test and verify pass.

### Task 3: Database and Services

**Files:**
- Create: `src/db/db.js`
- Create: `src/db/enums.js`
- Create: `src/db/seed.js`
- Create: `src/services/ingredientService.js`
- Create: `src/services/menuService.js`
- Create: `src/services/recipeService.js`
- Create: `src/services/saleService.js`
- Create: `src/services/reportService.js`
- Create: `src/services/backupService.js`

- [ ] Create Dexie schema exactly from `AGENTS.md`.
- [ ] Create enums with stable string constants.
- [ ] Create seed data for Latteva ingredients, menus, and recipes.
- [ ] Implement ingredient CRUD and restock with moving average and stock movements.
- [ ] Implement menu CRUD/deactivate, recipe save/calc, atomic sale save, daily report, and backup import/export.
- [ ] Add focused tests if persistence behavior needs coverage beyond pure logic.

### Task 4: UI Foundation

**Files:**
- Create: `src/utils/labels.js`
- Create: `src/utils/format.js`
- Create: `src/utils/date.js`
- Create: `src/hooks/useStockStatus.js`
- Create: `src/components/ui/Button.jsx`
- Create: `src/components/ui/Card.jsx`
- Create: `src/components/ui/Badge.jsx`
- Create: `src/components/ui/QtyStepper.jsx`
- Create: `src/components/layout/AppShell.jsx`
- Create: `src/components/layout/BottomNav.jsx`

- [ ] Centralize all visible Indonesian text in `labels.js`.
- [ ] Implement formatting helpers and stock status hook.
- [ ] Build reusable UI pieces using design handoff colors and spacing.

### Task 5: First Screens

**Files:**
- Create: `src/pages/Dashboard.jsx`
- Create: `src/pages/Sales.jsx`
- Create: `src/pages/Ingredients.jsx`
- Create: `src/pages/More.jsx`
- Modify: `src/App.jsx`

- [ ] Dashboard shows today sales/profit, sold count, waste placeholder, low stock list, and backup reminder.
- [ ] Sales page shows menu grid, cart, totals, recipe-missing tag, insufficient-stock warning, and save sale.
- [ ] Ingredients page shows search/filter, status badge, stock values, restock quick action, empty/search-empty states.
- [ ] More page links future MVP pages as placeholders.

### Task 6: Verification

**Files:**
- All project files.

- [ ] Run `pnpm test -- --run`.
- [ ] Run `pnpm build`.
- [ ] Fix failures.
- [ ] Report exact verification results.
