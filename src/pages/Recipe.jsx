import { Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import BackButton from '../components/layout/BackButton.jsx';
import Button from '../components/ui/Button.jsx';
import Card from '../components/ui/Card.jsx';
import SelectInput from '../components/ui/SelectInput.jsx';
import TextInput from '../components/ui/TextInput.jsx';
import { calculateMenuHpp } from '../domain/inventory.js';
import { getRecipeEditorData, listRecipesByMenu, saveRecipe } from '../services/recipeService.js';
import { formatRupiah } from '../utils/format.js';
import { labels } from '../utils/labels.js';

export default function Recipe() {
  const data = useLiveQuery(() => getRecipeEditorData(), []);
  const menus = data?.menus ?? [];
  const ingredients = data?.ingredients ?? [];
  const [menuId, setMenuId] = useState('');
  const [rows, setRows] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!menuId && menus[0]) setMenuId(String(menus[0].id));
  }, [menuId, menus]);

  useEffect(() => {
    if (!menuId) return;
    listRecipesByMenu(menuId).then((recipes) => {
      setRows(recipes.map((recipe) => ({ ingredientId: String(recipe.ingredientId), qty: String(recipe.qty) })));
    });
  }, [menuId]);

  const selectedMenu = menus.find((menu) => menu.id === Number(menuId));
  const hpp = useMemo(() => {
    const recipeRows = rows.map((row) => ({
      ingredientId: Number(row.ingredientId),
      qty: Number(row.qty) || 0,
    }));
    return calculateMenuHpp({ recipes: recipeRows, ingredients });
  }, [ingredients, rows]);
  const profit = (selectedMenu?.sellingPrice ?? 0) - hpp;
  const margin = selectedMenu?.sellingPrice ? (profit / selectedMenu.sellingPrice) * 100 : 0;

  function addRow() {
    const firstIngredient = ingredients[0];
    if (!firstIngredient) return;
    setRows((current) => [...current, { ingredientId: String(firstIngredient.id), qty: '' }]);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    await saveRecipe(
      menuId,
      rows
        .filter((row) => row.ingredientId && Number(row.qty) > 0)
        .map((row) => ({ ingredientId: Number(row.ingredientId), qty: Number(row.qty) })),
    );
    setMessage(labels.recipeSaved);
  }

  return (
    <div className="space-y-4 py-4">
      <header className="flex h-14 items-center">
        <BackButton />
        <h1 className="text-[22px] font-extrabold">{labels.recipes}</h1>
      </header>
      {message && <div className="rounded-2xl bg-[#EAF6EC] px-4 py-3 text-sm font-bold text-success">{message}</div>}
      {menus.length === 0 || ingredients.length === 0 ? (
        <Card>
          <p className="font-extrabold">{labels.noData}</p>
          <p className="mt-1 text-sm font-semibold text-text-secondary">
            {labels.recipeNeedsMenuAndIngredient}
          </p>
        </Card>
      ) : null}
      <Card>
        <form className="grid gap-3" onSubmit={handleSubmit}>
          <SelectInput label={labels.chooseMenu} value={menuId} onChange={(e) => setMenuId(e.target.value)}>
            {menus.map((menu) => <option key={menu.id} value={menu.id}>{menu.name}</option>)}
          </SelectInput>

          <div className="grid grid-cols-3 gap-2 rounded-2xl bg-surface-alt p-3 text-center">
            <div><p className="text-xs font-bold text-text-secondary">{labels.hpp}</p><p className="font-extrabold">{formatRupiah(hpp)}</p></div>
            <div><p className="text-xs font-bold text-text-secondary">{labels.profit}</p><p className="font-extrabold text-success">{formatRupiah(profit)}</p></div>
            <div><p className="text-xs font-bold text-text-secondary">{labels.margin}</p><p className="font-extrabold">{margin.toFixed(1)}%</p></div>
          </div>

          <h2 className="font-extrabold">{labels.recipeRows}</h2>
          {rows.map((row, index) => {
            const ingredient = ingredients.find((item) => item.id === Number(row.ingredientId));
            return (
              <div key={`${row.ingredientId}-${index}`} className="grid grid-cols-[1fr_96px_36px] gap-2">
                <SelectInput label={labels.chooseIngredient} value={row.ingredientId} onChange={(e) => setRows((current) => current.map((item, rowIndex) => rowIndex === index ? { ...item, ingredientId: e.target.value } : item))}>
                  {ingredients.map((item) => <option key={item.id} value={item.id}>{item.name} ({item.unit})</option>)}
                </SelectInput>
                <TextInput label={`${labels.qty} ${ingredient?.unit ?? ''}`} type="number" min="0" step="0.01" value={row.qty} onChange={(e) => setRows((current) => current.map((item, rowIndex) => rowIndex === index ? { ...item, qty: e.target.value } : item))} />
                <button type="button" className="mt-6 grid h-12 place-items-center rounded-xl border border-border text-danger" onClick={() => setRows((current) => current.filter((_, rowIndex) => rowIndex !== index))}>
                  <Trash2 size={18} />
                </button>
              </div>
            );
          })}
          <button type="button" className="rounded-2xl bg-surface-alt px-4 py-3 font-bold text-primary" onClick={addRow}>{labels.addRecipeRow}</button>
          <Button type="submit" className="w-full">{labels.saveRecipe}</Button>
        </form>
      </Card>
    </div>
  );
}
