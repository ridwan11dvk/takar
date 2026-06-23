import { Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  const [menuId, setMenuId] = useState('');
  const [rows, setRows] = useState([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!menuId && menus[0]) setMenuId(String(menus[0].id));
  }, [menuId, menus]);

  useEffect(() => {
    if (!menuId) return;
    setSaved(false);
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
    setSaved(false);
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
    setSaved(true);
  }

  return (
    <div className="space-y-4 py-4">
      <header className="flex h-14 items-center">
        <BackButton />
        <h1 className="text-[22px] font-extrabold">{labels.recipes}</h1>
      </header>
      {saved && (
        <Card className="space-y-3 border border-success/30 bg-[#EAF6EC]">
          <p className="font-extrabold text-success">{labels.recipeSavedNext}</p>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={() => navigate('/menus')}>{labels.backToMenu}</Button>
            <Button onClick={() => navigate('/sales')}>{labels.goToSales}</Button>
          </div>
        </Card>
      )}
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
          {rows.length > 0 && (
            <div className="grid grid-cols-[1fr_88px_44px] gap-2 px-1 text-xs font-bold text-text-secondary">
              <span>{labels.chooseIngredient}</span>
              <span>{labels.qty}</span>
              <span className="sr-only">{labels.delete}</span>
            </div>
          )}
          {rows.map((row, index) => {
            const ingredient = ingredients.find((item) => item.id === Number(row.ingredientId));
            return (
              <div key={`${row.ingredientId}-${index}`} className="grid grid-cols-[1fr_88px_44px] items-center gap-2">
                <SelectInput value={row.ingredientId} onChange={(e) => setRows((current) => current.map((item, rowIndex) => rowIndex === index ? { ...item, ingredientId: e.target.value } : item))}>
                  {ingredients.map((item) => <option key={item.id} value={item.id}>{item.name} ({item.unit})</option>)}
                </SelectInput>
                <div className="flex items-center gap-1">
                  <TextInput className="flex-1" type="number" min="0" step="0.01" inputMode="decimal" placeholder="0" value={row.qty} onChange={(e) => setRows((current) => current.map((item, rowIndex) => rowIndex === index ? { ...item, qty: e.target.value } : item))} />
                  <span className="w-7 shrink-0 text-xs font-bold text-text-muted">{ingredient?.unit ?? ''}</span>
                </div>
                <button type="button" aria-label={`${labels.delete} ${ingredient?.name ?? ''}`} className="grid h-12 place-items-center rounded-xl border border-border text-danger" onClick={() => setRows((current) => current.filter((_, rowIndex) => rowIndex !== index))}>
                  <Trash2 size={18} />
                </button>
              </div>
            );
          })}
          {rows.length === 0 && (
            <p className="rounded-2xl bg-surface-alt px-4 py-3 text-center text-sm font-semibold text-text-muted">{labels.recipeEmptyHint}</p>
          )}
          <button type="button" className="rounded-2xl bg-surface-alt px-4 py-3 font-bold text-primary" onClick={addRow}>{labels.addRecipeRow}</button>
          <Button type="submit" className="w-full">{labels.saveRecipe}</Button>
        </form>
      </Card>
    </div>
  );
}
