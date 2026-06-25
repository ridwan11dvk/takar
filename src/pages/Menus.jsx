import { Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import BackButton from '../components/layout/BackButton.jsx';
import Badge from '../components/ui/Badge.jsx';
import Button from '../components/ui/Button.jsx';
import Card from '../components/ui/Card.jsx';
import Modal from '../components/ui/Modal.jsx';
import SelectInput from '../components/ui/SelectInput.jsx';
import TextInput from '../components/ui/TextInput.jsx';
import { CategoryType } from '../domain/category.js';
import { calculateMenuExtraCost, calculateMenuHpp } from '../domain/inventory.js';
import { ensureDefaultCategories, listCategories } from '../services/categoryService.js';
import { listIngredients } from '../services/ingredientService.js';
import { createMenu, deleteOrDeactivateMenu, listMenus, updateMenu } from '../services/menuService.js';
import { listRecipesByMenu, saveRecipe } from '../services/recipeService.js';
import { formatQty, formatRupiah } from '../utils/format.js';
import { labels } from '../utils/labels.js';

const initialForm = {
  name: '',
  category: 'Minuman',
  sellingPrice: '',
  packagingCost: '',
  utilityCost: '',
  marketplaceCost: '',
  otherCost: '',
};

function getMarginStatus(margin, profit) {
  if (profit < 0) return { label: labels.losingMargin, tone: 'danger' };
  if (margin < 30) return { label: labels.thinMargin, tone: 'warning' };
  return { label: labels.healthyMargin, tone: 'success' };
}

function getRowCost(row, ingredients) {
  const ingredient = ingredients.find((item) => item.id === Number(row.ingredientId));
  const qty = Number(row.qty) || 0;

  return {
    ingredient,
    qty,
    totalCost: qty * (ingredient?.avgCostPerUnit ?? 0),
  };
}

export default function Menus() {
  const menus = useLiveQuery(() => listMenus(), []) ?? [];
  const categoryOptions = useLiveQuery(() => listCategories(CategoryType.MENU), []) ?? [];
  const ingredients = useLiveQuery(() => listIngredients(), []) ?? [];
  const activeMenus = menus.filter((menu) => menu.isActive);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [message, setMessage] = useState('');
  const [recipeMenuId, setRecipeMenuId] = useState('');
  const [recipeRows, setRecipeRows] = useState([]);
  const [recipeSaved, setRecipeSaved] = useState(false);

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

  useEffect(() => {
    if (!recipeMenuId && activeMenus[0]) setRecipeMenuId(String(activeMenus[0].id));
  }, [activeMenus, recipeMenuId]);

  useEffect(() => {
    if (!recipeMenuId) return;
    setRecipeSaved(false);
    listRecipesByMenu(recipeMenuId).then((recipes) => {
      setRecipeRows(recipes.map((recipe) => ({ ingredientId: String(recipe.ingredientId), qty: String(recipe.qty) })));
    });
  }, [recipeMenuId]);

  const selectedRecipeMenu = activeMenus.find((menu) => menu.id === Number(recipeMenuId));
  const recipeIngredientCost = useMemo(() => {
    const rows = recipeRows.map((row) => ({
      ingredientId: Number(row.ingredientId),
      qty: Number(row.qty) || 0,
    }));
    return calculateMenuHpp({ recipes: rows, ingredients });
  }, [ingredients, recipeRows]);
  const recipeExtraCost = calculateMenuExtraCost(selectedRecipeMenu);
  const recipeHpp = recipeIngredientCost + recipeExtraCost;
  const recipeProfit = (selectedRecipeMenu?.sellingPrice ?? 0) - recipeHpp;
  const recipeMargin = selectedRecipeMenu?.sellingPrice ? (recipeProfit / selectedRecipeMenu.sellingPrice) * 100 : 0;
  const marginStatus = getMarginStatus(recipeMargin, recipeProfit);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!form.name.trim()) return;
    if (editingId) {
      await updateMenu(editingId, {
        name: form.name.trim(),
        category: form.category.trim(),
        sellingPrice: Number(form.sellingPrice) || 0,
        packagingCost: Number(form.packagingCost) || 0,
        utilityCost: Number(form.utilityCost) || 0,
        marketplaceCost: Number(form.marketplaceCost) || 0,
        otherCost: Number(form.otherCost) || 0,
        isActive: true,
      });
    } else {
      const newMenuId = await createMenu(form);
      setRecipeMenuId(String(newMenuId));
    }
    setForm(initialForm);
    setEditingId(null);
    setMessage(labels.initialDataSaved);
  }

  function handleEdit(menu) {
    setEditingId(menu.id);
    setForm({
      name: menu.name,
      category: menu.category,
      sellingPrice: String(menu.sellingPrice),
      packagingCost: String(menu.packagingCost ?? 0),
      utilityCost: String(menu.utilityCost ?? 0),
      marketplaceCost: String(menu.marketplaceCost ?? 0),
      otherCost: String(menu.otherCost ?? 0),
    });
  }

  async function handleDelete(menu) {
    const result = await deleteOrDeactivateMenu(menu.id);
    setMessage(result.mode === 'deleted' ? labels.menuDeleted : labels.menuDeactivated);
    setDeleteTarget(null);
    if (recipeMenuId === String(menu.id)) {
      setRecipeMenuId('');
      setRecipeRows([]);
    }
  }

  function addRecipeRow() {
    const firstIngredient = ingredients[0];
    if (!firstIngredient) return;
    setRecipeSaved(false);
    setRecipeRows((current) => [...current, { ingredientId: String(firstIngredient.id), qty: '' }]);
  }

  async function handleRecipeSubmit(event) {
    event.preventDefault();
    await saveRecipe(
      recipeMenuId,
      recipeRows
        .filter((row) => row.ingredientId && Number(row.qty) > 0)
        .map((row) => ({ ingredientId: Number(row.ingredientId), qty: Number(row.qty) })),
    );
    setRecipeSaved(true);
  }

  return (
    <div className="space-y-4 py-4">
      <header className="flex h-14 items-center">
        <BackButton />
        <h1 className="text-[22px] font-extrabold">{labels.menuAndRecipe}</h1>
      </header>

      {message && <div className="rounded-2xl bg-[#EAF6EC] px-4 py-3 text-sm font-bold text-success">{message}</div>}

      <Card>
        <div className="mb-3">
          <h2 className="font-extrabold">{labels.menuList}</h2>
          <p className="mt-1 text-sm font-semibold text-text-secondary">{labels.menuAndRecipeDescription}</p>
        </div>
        <form className="grid gap-3" onSubmit={handleSubmit}>
          <TextInput label={labels.menuName} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <SelectInput label={labels.category} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {categoryOptions.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}
          </SelectInput>
          <TextInput
            label={labels.sellingPrice}
            type="number"
            min="0"
            value={form.sellingPrice}
            onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })}
          />
          <div className="rounded-2xl bg-surface-alt p-3">
            <p className="mb-2 text-sm font-extrabold">{labels.optionalCosts}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <TextInput label={labels.packagingCost} type="number" min="0" value={form.packagingCost} onChange={(e) => setForm({ ...form, packagingCost: e.target.value })} />
              <TextInput label={labels.utilityCost} type="number" min="0" value={form.utilityCost} onChange={(e) => setForm({ ...form, utilityCost: e.target.value })} />
              <TextInput label={labels.marketplaceCost} type="number" min="0" value={form.marketplaceCost} onChange={(e) => setForm({ ...form, marketplaceCost: e.target.value })} />
              <TextInput label={labels.otherCost} type="number" min="0" value={form.otherCost} onChange={(e) => setForm({ ...form, otherCost: e.target.value })} />
            </div>
          </div>
          <Button type="submit" className="w-full">{editingId ? labels.save : labels.addMenu}</Button>
        </form>
      </Card>

      <Card aria-label={labels.recipeSection} role="region">
        <form className="grid gap-3" onSubmit={handleRecipeSubmit}>
          <div>
            <h2 className="font-extrabold">{labels.recipeSection}</h2>
            <p className="mt-1 text-sm font-semibold text-text-secondary">{labels.recipeWorkflowHint}</p>
          </div>

          {activeMenus.length === 0 || ingredients.length === 0 ? (
            <div className="rounded-2xl bg-surface-alt px-4 py-3">
              <p className="font-extrabold">{labels.noData}</p>
              <p className="mt-1 text-sm font-semibold text-text-secondary">
                {labels.recipeNeedsMenuAndIngredient}
              </p>
            </div>
          ) : (
            <>
              <SelectInput label={labels.chooseMenu} value={recipeMenuId} onChange={(e) => setRecipeMenuId(e.target.value)}>
                {activeMenus.map((menu) => <option key={menu.id} value={menu.id}>{menu.name}</option>)}
              </SelectInput>

              <div className="grid grid-cols-2 gap-2 rounded-2xl bg-surface-alt p-3 text-center">
                <div><p className="text-xs font-bold text-text-secondary">{labels.ingredientCost}</p><p className="font-extrabold">{formatRupiah(recipeIngredientCost)}</p></div>
                <div><p className="text-xs font-bold text-text-secondary">{labels.extraCost}</p><p className="font-extrabold">{formatRupiah(recipeExtraCost).replace(/\s/g, '')}</p></div>
                <div><p className="text-xs font-bold text-text-secondary">{labels.totalModal}</p><p className="font-extrabold">{formatRupiah(recipeHpp).replace(/\s/g, '')}</p></div>
                <div><p className="text-xs font-bold text-text-secondary">{labels.profit}</p><p className={`font-extrabold ${recipeProfit < 0 ? 'text-danger' : 'text-success'}`}>{formatRupiah(recipeProfit)}</p></div>
                <div><p className="text-xs font-bold text-text-secondary">{labels.margin}</p><p className="font-extrabold">{recipeMargin.toLocaleString('id-ID', { maximumFractionDigits: 1 })}%</p></div>
                <div><p className="text-xs font-bold text-text-secondary">Status</p><Badge label={marginStatus.label} tone={marginStatus.tone} /></div>
              </div>

              <h3 className="font-extrabold">{labels.recipeRows}</h3>
              {recipeRows.map((row, index) => {
                const { ingredient, qty, totalCost } = getRowCost(row, ingredients);
                return (
                  <div key={`${row.ingredientId}-${index}`} className="space-y-2 rounded-2xl border border-border bg-surface-alt p-3">
                    <SelectInput value={row.ingredientId} onChange={(e) => setRecipeRows((current) => current.map((item, rowIndex) => rowIndex === index ? { ...item, ingredientId: e.target.value } : item))}>
                      {ingredients.map((item) => <option key={item.id} value={item.id}>{item.name} ({item.unit})</option>)}
                    </SelectInput>
                    <div className="flex items-center gap-2">
                      <TextInput className="flex-1" type="number" min="0" step="0.01" inputMode="decimal" placeholder={`${labels.qty}…`} value={row.qty} onChange={(e) => setRecipeRows((current) => current.map((item, rowIndex) => rowIndex === index ? { ...item, qty: e.target.value } : item))} />
                      <span className="w-12 shrink-0 text-center text-sm font-bold text-text-muted">{ingredient?.unit ?? ''}</span>
                      <button type="button" aria-label={`${labels.delete} ${ingredient?.name ?? ''}`} className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-border bg-white text-danger" onClick={() => setRecipeRows((current) => current.filter((_, rowIndex) => rowIndex !== index))}>
                        <Trash2 size={18} />
                      </button>
                    </div>
                    {ingredient && (
                      <div className="rounded-2xl bg-white px-4 py-3 text-sm font-bold">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-text-secondary">{labels.recipeRowCost} {formatQty(qty)} {ingredient.unit}</span>
                          <span>{formatRupiah(totalCost).replace(/\s/g, '')}</span>
                        </div>
                        <p className="mt-1 text-xs font-semibold text-text-muted">{formatRupiah(ingredient.avgCostPerUnit).replace(/\s/g, '')}/{ingredient.unit}</p>
                      </div>
                    )}
                  </div>
                );
              })}
              {recipeRows.length === 0 && (
                <p className="rounded-2xl bg-surface-alt px-4 py-3 text-center text-sm font-semibold text-text-muted">{labels.recipeEmptyHint}</p>
              )}
              <button type="button" className="rounded-2xl bg-surface-alt px-4 py-3 font-bold text-primary" onClick={addRecipeRow}>{labels.addRecipeRow}</button>
              <Button type="submit" className="w-full">{labels.saveRecipe}</Button>
              {recipeSaved && <p className="rounded-2xl bg-[#EAF6EC] px-4 py-3 text-sm font-bold text-success">{labels.recipeSaved}</p>}
            </>
          )}
        </form>
      </Card>

      <div className="space-y-3">
        {menus.map((menu) => (
          <Card key={menu.id} className="flex items-center justify-between gap-3">
            <button type="button" className="min-w-0 flex-1 text-left" onClick={() => setRecipeMenuId(String(menu.id))}>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-extrabold">{menu.name}</h2>
                <Badge label={menu.isActive ? labels.active : labels.inactive} tone={menu.isActive ? 'success' : 'danger'} />
              </div>
              <p className="mt-1 text-sm font-semibold text-text-secondary">{menu.category}</p>
              <p className="mt-1 text-lg font-extrabold">{formatRupiah(menu.sellingPrice)}</p>
            </button>
            <div className="flex shrink-0 flex-col gap-2">
              <button className="rounded-xl border border-border px-3 py-2 text-sm font-bold text-primary" type="button" onClick={() => handleEdit(menu)}>{labels.edit}</button>
              <button className="rounded-xl border border-border px-3 py-2 text-sm font-bold text-danger" type="button" onClick={() => setDeleteTarget(menu)}>{labels.delete}</button>
            </div>
          </Card>
        ))}
      </div>
      {editingId && (
        <Modal title={labels.editMenu} onClose={() => { setEditingId(null); setForm(initialForm); }}>
          <form className="grid gap-3" onSubmit={handleSubmit}>
            <TextInput label={labels.menuName} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <SelectInput label={labels.category} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {categoryOptions.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}
            </SelectInput>
            <TextInput label={labels.sellingPrice} type="number" min="0" value={form.sellingPrice} onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })} />
            <div className="rounded-2xl bg-surface-alt p-3">
              <p className="mb-2 text-sm font-extrabold">{labels.optionalCosts}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <TextInput label={labels.packagingCost} type="number" min="0" value={form.packagingCost} onChange={(e) => setForm({ ...form, packagingCost: e.target.value })} />
                <TextInput label={labels.utilityCost} type="number" min="0" value={form.utilityCost} onChange={(e) => setForm({ ...form, utilityCost: e.target.value })} />
                <TextInput label={labels.marketplaceCost} type="number" min="0" value={form.marketplaceCost} onChange={(e) => setForm({ ...form, marketplaceCost: e.target.value })} />
                <TextInput label={labels.otherCost} type="number" min="0" value={form.otherCost} onChange={(e) => setForm({ ...form, otherCost: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button type="submit">{labels.save}</Button>
              <Button variant="secondary" onClick={() => { setEditingId(null); setForm(initialForm); }}>{labels.cancel}</Button>
            </div>
          </form>
        </Modal>
      )}
      {deleteTarget && (
        <Modal title={labels.confirmDelete} onClose={() => setDeleteTarget(null)}>
          <p className="font-bold">{labels.deleteMenuConfirm}</p>
          <p className="mt-1 text-sm font-semibold text-text-secondary">{deleteTarget.name} · {labels.deleteWarning}</p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>{labels.cancel}</Button>
            <Button variant="warning" onClick={() => handleDelete(deleteTarget)}>{labels.yesDelete}</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
