import { Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Link } from 'react-router-dom';
import Badge from '../components/ui/Badge.jsx';
import Button from '../components/ui/Button.jsx';
import Card from '../components/ui/Card.jsx';
import Modal from '../components/ui/Modal.jsx';
import SelectInput from '../components/ui/SelectInput.jsx';
import TextInput from '../components/ui/TextInput.jsx';
import { Unit } from '../db/enums.js';
import { CategoryType } from '../domain/category.js';
import { getStockStatus } from '../domain/inventory.js';
import { ensureDefaultCategories, listCategories } from '../services/categoryService.js';
import { createIngredient, deleteIngredientSafely, listIngredients, restockIngredient, updateIngredient } from '../services/ingredientService.js';
import { formatQty, formatRupiah } from '../utils/format.js';
import { labels } from '../utils/labels.js';

const quickActions = [
  { label: labels.menuAndRecipe, description: labels.stockHppHint, to: '/menus' },
  { label: labels.restock, description: labels.restockDescription, to: '/restock' },
  { label: labels.waste, description: labels.wasteDescription, to: '/waste' },
  { label: labels.stockCount, description: labels.stockCountDescription, to: '/stock-count' },
];

const stockSections = [
  { key: 'stock', label: labels.stockTabStock },
  { key: 'hpp', label: labels.stockTabHpp },
  { key: 'activity', label: labels.stockTabActivity },
];

export default function Ingredients() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState(labels.all);
  const [showForm, setShowForm] = useState(false);
  const [activeSection, setActiveSection] = useState('stock');
  const [editingId, setEditingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({
    name: '',
    category: 'Kopi',
    unit: Unit.GRAM,
    currentStock: '',
    minStock: '',
    avgCostPerUnit: '',
    purchaseTotalPrice: '',
    lastPurchasePrice: '',
    note: '',
  });
  const ingredients = useLiveQuery(() => listIngredients(), []) ?? [];
  const categoryOptions = useLiveQuery(() => listCategories(CategoryType.INGREDIENT), []) ?? [];
  const filterCategories = [labels.all, ...categoryOptions.map((item) => item.name)];
  const stockSummary = useMemo(() => {
    const lowStockCount = ingredients.filter((ingredient) => ingredient.currentStock > 0 && ingredient.currentStock <= ingredient.minStock).length;
    const minusStockCount = ingredients.filter((ingredient) => ingredient.currentStock < 0).length;
    const stockValue = ingredients.reduce((total, ingredient) => {
      const positiveStock = Math.max(Number(ingredient.currentStock) || 0, 0);
      return total + positiveStock * (Number(ingredient.avgCostPerUnit) || 0);
    }, 0);

    return {
      total: ingredients.length,
      lowStockCount,
      minusStockCount,
      stockValue,
    };
  }, [ingredients]);

  useEffect(() => {
    ensureDefaultCategories().catch((error) => {
      console.error(error);
    });
  }, []);

  useEffect(() => {
    if (!categoryOptions.length) return;
    const exists = categoryOptions.some((item) => item.name === form.category);
    if (!exists) {
      setForm((current) => ({ ...current, category: categoryOptions[0].name }));
    }
  }, [categoryOptions, form.category]);

  const filteredIngredients = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return ingredients.filter((ingredient) => {
      const matchesCategory = category === labels.all || ingredient.category === category;
      const matchesQuery = ingredient.name.toLowerCase().includes(normalizedQuery);
      return matchesCategory && matchesQuery;
    });
  }, [category, ingredients, query]);

  async function handleRestock(ingredient) {
    const qty = Number(window.prompt(labels.restockQtyPrompt, '100'));
    if (!qty) return;
    const price = Number(window.prompt(labels.restockPricePrompt, String(qty * ingredient.avgCostPerUnit)));
    if (!price) return;
    await restockIngredient({ ingredientId: ingredient.id, qtyIn: qty, purchaseTotalPrice: price });
    window.alert(labels.restockSaved);
  }

  async function handleCreate(event) {
    event.preventDefault();
    if (editingId) {
      await updateIngredient(editingId, form);
    } else {
      // Hitung harga modal per satuan otomatis dari total harga beli ÷ stok awal.
      const qty = Number(form.currentStock) || 0;
      const totalPrice = Number(form.purchaseTotalPrice) || 0;
      const avgCostPerUnit = qty > 0 ? totalPrice / qty : 0;
      await createIngredient({ ...form, avgCostPerUnit, lastPurchasePrice: totalPrice });
    }
    setForm({
      name: '',
      category: 'Kopi',
      unit: Unit.GRAM,
      currentStock: '',
      minStock: '',
      avgCostPerUnit: '',
      purchaseTotalPrice: '',
      lastPurchasePrice: '',
      note: '',
    });
    setEditingId(null);
    setShowForm(false);
    setMessage(labels.initialDataSaved);
  }

  function handleEdit(ingredient) {
    setEditingId(ingredient.id);
    setShowForm(false);
    setForm({
      name: ingredient.name,
      category: ingredient.category,
      unit: ingredient.unit,
      currentStock: String(ingredient.currentStock),
      minStock: String(ingredient.minStock),
      avgCostPerUnit: String(ingredient.avgCostPerUnit),
      purchaseTotalPrice: '',
      lastPurchasePrice: String(ingredient.lastPurchasePrice),
      note: ingredient.note ?? '',
    });
  }

  async function handleDeleteConfirmed() {
    if (!deleteTarget) return;
    const result = await deleteIngredientSafely(deleteTarget.id);
    setMessage(result.ok ? labels.ingredientDeleted : labels.ingredientUsedWarning);
    setDeleteTarget(null);
  }

  return (
    <div className="space-y-4 py-4">
      <header className="flex h-14 items-center justify-between">
        <h1 className="text-[22px] font-extrabold">{labels.ingredientsTitle}</h1>
        <Button className="min-h-10 rounded-full px-4 text-sm" onClick={() => { setEditingId(null); setShowForm((value) => !value); }}>{labels.addIngredient}</Button>
      </header>

      {message && <div className="rounded-2xl bg-[#EAF6EC] px-4 py-3 text-sm font-bold text-success">{message}</div>}

      <Card>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-extrabold">{labels.stockSummary}</h2>
            <p className="mt-1 text-sm font-semibold text-text-secondary">{labels.stockHubHint}</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-2xl bg-surface-alt px-4 py-3">
            <p className="text-xs font-bold text-text-secondary">{labels.stockTotalIngredients}</p>
            <p className="mt-1 text-2xl font-extrabold">{stockSummary.total}</p>
          </div>
          <div className="rounded-2xl bg-surface-alt px-4 py-3">
            <p className="text-xs font-bold text-text-secondary">{labels.lowStock}</p>
            <p className="mt-1 text-2xl font-extrabold text-warning">{stockSummary.lowStockCount}</p>
          </div>
          <div className="rounded-2xl bg-surface-alt px-4 py-3">
            <p className="text-xs font-bold text-text-secondary">{labels.minus}</p>
            <p className="mt-1 text-2xl font-extrabold text-danger">{stockSummary.minusStockCount}</p>
          </div>
          <div className="rounded-2xl bg-surface-alt px-4 py-3">
            <p className="text-xs font-bold text-text-secondary">{labels.stockValue}</p>
            <p className="mt-1 text-lg font-extrabold">{formatRupiah(stockSummary.stockValue)}</p>
          </div>
        </div>
      </Card>

      <nav aria-label={labels.stockQuickActions} className="grid grid-cols-2 gap-2">
        {quickActions.map((action) => (
          <Link key={action.to} to={action.to} className="rounded-2xl bg-white px-4 py-3 shadow-soft">
            <span className="block font-extrabold text-primary">{action.label}</span>
            <span className="mt-1 block text-xs font-semibold text-text-secondary">{action.description}</span>
          </Link>
        ))}
      </nav>

      <div role="tablist" aria-label={labels.stockSections} className="flex gap-2 overflow-x-auto pb-1">
        {stockSections.map((section) => (
          <button
            key={section.key}
            type="button"
            role="tab"
            aria-selected={activeSection === section.key}
            className={`min-h-10 shrink-0 rounded-full px-4 text-sm font-bold ${
              activeSection === section.key ? 'bg-primary text-white' : 'bg-white text-text-secondary'
            }`}
            onClick={() => setActiveSection(section.key)}
          >
            {section.label}
          </button>
        ))}
      </div>

      {showForm && (
        <Card>
          <form className="grid gap-3" onSubmit={handleCreate}>
            <TextInput label={labels.ingredientName} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <SelectInput label={labels.category} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {categoryOptions.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}
            </SelectInput>
            <SelectInput label={labels.unit} value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>
              <option value={Unit.GRAM}>gram</option>
              <option value={Unit.ML}>ml</option>
              <option value={Unit.PCS}>pcs</option>
            </SelectInput>
            <div className="grid grid-cols-2 gap-3">
              <TextInput label={`${labels.initialStock} (${form.unit})`} type="number" step="0.01" allowNegative value={form.currentStock} onChange={(e) => setForm({ ...form, currentStock: e.target.value })} />
              <TextInput label={`${labels.minStock} (${form.unit})`} type="number" step="0.01" value={form.minStock} onChange={(e) => setForm({ ...form, minStock: e.target.value })} />
            </div>
            <p className="-mt-1 text-xs font-semibold text-text-muted">{labels.initialStockHint}</p>
            <TextInput label={labels.purchaseTotalPrice} type="number" step="0.01" value={form.purchaseTotalPrice} onChange={(e) => setForm({ ...form, purchaseTotalPrice: e.target.value })} />
            <p className="-mt-1 text-xs font-semibold text-text-muted">{labels.purchaseTotalPriceHint}</p>
            {Number(form.currentStock) > 0 && Number(form.purchaseTotalPrice) > 0 && (
              <div className="rounded-2xl bg-surface-alt px-4 py-2 text-sm font-bold">
                {`${labels.avgCostPerUnitShort} ${form.unit}`}: {formatRupiah(Number(form.purchaseTotalPrice) / Number(form.currentStock))}
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              <Button type="submit" className="w-full" disabled={!form.name.trim()}>{labels.save}</Button>
              <button type="button" className="rounded-2xl border border-border font-bold" onClick={() => { setEditingId(null); setShowForm(false); }}>{labels.cancel}</button>
            </div>
          </form>
        </Card>
      )}

      {activeSection === 'stock' && (
        <>
          <label className="flex h-12 items-center gap-2 rounded-2xl bg-white px-4 shadow-soft">
            <Search className="text-text-muted" size={20} />
            <input
              className="w-full bg-transparent text-sm font-semibold outline-none placeholder:text-text-muted"
              placeholder={labels.searchIngredient}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {filterCategories.map((item) => (
              <button
                key={item}
                type="button"
                className={`min-h-10 shrink-0 rounded-full px-4 text-sm font-bold ${
                  item === category ? 'bg-primary text-white' : 'bg-white text-text-secondary'
                }`}
                onClick={() => setCategory(item)}
              >
                {item}
              </button>
            ))}
          </div>

          {ingredients.length === 0 && (
            <Card className="py-10 text-center">
              <p className="text-lg font-extrabold">{labels.emptyIngredients}</p>
              <Button className="mt-4" onClick={() => { setEditingId(null); setShowForm(true); }}>{labels.addIngredient}</Button>
            </Card>
          )}

          {ingredients.length > 0 && filteredIngredients.length === 0 && (
            <Card className="py-10 text-center">
              <p className="text-lg font-extrabold">{labels.ingredientNotFound}</p>
              <p className="mt-1 text-sm font-semibold text-text-secondary">{labels.addNewIngredientHint}</p>
            </Card>
          )}

          <div className="space-y-3">
            {filteredIngredients.map((ingredient) => {
              const status = getStockStatus(ingredient);
              return (
                <Card key={ingredient.id} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base font-bold">{ingredient.name}</h2>
                      <Badge label={status.label} tone={status.tone} />
                    </div>
                    <p className={`mt-2 text-xl font-extrabold ${status.key === 'minus' ? 'text-danger' : ''}`}>
                      {formatQty(ingredient.currentStock)} {ingredient.unit}
                    </p>
                    <p className="text-xs font-semibold text-text-muted">{ingredient.category}</p>
                  </div>
                  <div className="flex shrink-0 flex-col gap-2">
                    <button
                      type="button"
                      className="min-h-10 rounded-xl bg-surface-alt px-3 text-sm font-bold text-primary"
                      onClick={() => handleRestock(ingredient)}
                    >
                      {labels.restock}
                    </button>
                    <button
                      type="button"
                      className="min-h-10 rounded-xl border border-border px-3 text-sm font-bold text-text-secondary"
                      onClick={() => handleEdit(ingredient)}
                    >
                      {labels.edit}
                    </button>
                    <button
                      type="button"
                      className="min-h-10 rounded-xl border border-border px-3 text-sm font-bold text-danger"
                      onClick={() => setDeleteTarget(ingredient)}
                    >
                      {labels.delete}
                    </button>
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}

      {activeSection === 'hpp' && (
        <Card>
          <h2 className="font-extrabold">{labels.menuAndRecipe}</h2>
          <p className="mt-1 text-sm font-semibold text-text-secondary">{labels.stockHppHint}</p>
          <Link to="/menus" className="mt-4 block rounded-2xl bg-primary px-4 py-3 text-center font-bold text-white">
            {labels.menuAndRecipe}
          </Link>
        </Card>
      )}

      {activeSection === 'activity' && (
        <Card>
          <h2 className="font-extrabold">{labels.stockTabActivity}</h2>
          <p className="mt-1 text-sm font-semibold text-text-secondary">{labels.stockActivityHint}</p>
          <div className="mt-4 grid gap-2">
            <Link to="/restock" className="rounded-2xl bg-surface-alt px-4 py-3 font-bold text-primary">{labels.restock}</Link>
            <Link to="/waste" className="rounded-2xl bg-surface-alt px-4 py-3 font-bold text-primary">{labels.waste}</Link>
            <Link to="/stock-count" className="rounded-2xl bg-surface-alt px-4 py-3 font-bold text-primary">{labels.stockCount}</Link>
          </div>
        </Card>
      )}
      {editingId && (
        <Modal title={labels.editIngredient} onClose={() => { setEditingId(null); setForm({ name: '', category: categoryOptions[0]?.name ?? 'Kopi', unit: Unit.GRAM, currentStock: '', minStock: '', avgCostPerUnit: '', purchaseTotalPrice: '', lastPurchasePrice: '', note: '' }); }}>
          <form className="grid gap-3" onSubmit={handleCreate}>
            <TextInput label={labels.ingredientName} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <SelectInput label={labels.category} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {categoryOptions.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}
            </SelectInput>
            <SelectInput label={labels.unit} value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>
              <option value={Unit.GRAM}>gram</option>
              <option value={Unit.ML}>ml</option>
              <option value={Unit.PCS}>pcs</option>
            </SelectInput>
            <div className="grid grid-cols-2 gap-3">
              <TextInput label={`${labels.currentStock} (${form.unit})`} type="number" step="0.01" allowNegative value={form.currentStock} onChange={(e) => setForm({ ...form, currentStock: e.target.value })} />
              <TextInput label={`${labels.minStock} (${form.unit})`} type="number" step="0.01" value={form.minStock} onChange={(e) => setForm({ ...form, minStock: e.target.value })} />
            </div>
            <p className="-mt-1 text-xs font-semibold text-text-muted">{labels.currentStockHint}</p>
            <div className="rounded-2xl border border-border bg-surface-alt px-4 py-3">
              <span className="block text-sm font-bold text-text-secondary">{`${labels.avgCostPerUnitShort} ${form.unit}`}</span>
              <span className="mt-1 block text-lg font-extrabold">{formatRupiah(Number(form.avgCostPerUnit) || 0)}</span>
              <span className="mt-1 block text-xs font-semibold text-text-muted">{labels.avgCostAutoNote}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button type="submit" disabled={!form.name.trim()}>{labels.save}</Button>
              <Button variant="secondary" onClick={() => setEditingId(null)}>{labels.cancel}</Button>
            </div>
          </form>
        </Modal>
      )}
      {deleteTarget && (
        <Modal title={labels.confirmDelete} onClose={() => setDeleteTarget(null)}>
          <p className="font-bold">{labels.deleteIngredientConfirm}</p>
          <p className="mt-1 text-sm font-semibold text-text-secondary">{deleteTarget.name} · {labels.deleteWarning}</p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>{labels.cancel}</Button>
            <Button variant="warning" onClick={handleDeleteConfirmed}>{labels.yesDelete}</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
