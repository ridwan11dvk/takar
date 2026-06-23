import { useEffect, useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import BackButton from '../components/layout/BackButton.jsx';
import Button from '../components/ui/Button.jsx';
import Card from '../components/ui/Card.jsx';
import SelectInput from '../components/ui/SelectInput.jsx';
import TextInput from '../components/ui/TextInput.jsx';
import { calculateIngredientWasteDraft, calculateMenuWasteDraft } from '../domain/inventory.js';
import { getWasteEntryData, saveIngredientWaste, saveMenuWaste } from '../services/wasteService.js';
import { formatQty, formatRupiah } from '../utils/format.js';
import { labels } from '../utils/labels.js';

export default function Waste() {
  const data = useLiveQuery(() => getWasteEntryData(), []);
  const ingredients = data?.ingredients ?? [];
  const menus = data?.menus ?? [];
  const recipes = data?.recipes ?? [];
  const [mode, setMode] = useState('INGREDIENT');
  const [ingredientId, setIngredientId] = useState('');
  const [menuId, setMenuId] = useState('');
  const [qty, setQty] = useState('');
  const [note, setNote] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!ingredientId && ingredients[0]) setIngredientId(String(ingredients[0].id));
    if (!menuId && menus[0]) setMenuId(String(menus[0].id));
  }, [ingredientId, ingredients, menuId, menus]);

  const draft = useMemo(() => {
    const amount = Number(qty);
    if (!amount) return null;
    if (mode === 'INGREDIENT') {
      const ingredient = ingredients.find((item) => item.id === Number(ingredientId));
      return ingredient ? calculateIngredientWasteDraft({ ingredient, qty: amount }) : null;
    }
    return calculateMenuWasteDraft({ menuId: Number(menuId), qty: amount, menus, recipes, ingredients });
  }, [ingredientId, ingredients, menuId, menus, mode, qty, recipes]);

  async function handleSubmit(event) {
    event.preventDefault();
    if (mode === 'INGREDIENT') {
      await saveIngredientWaste({ ingredientId, qty, note });
    } else {
      await saveMenuWaste({ menuId, qty, note });
    }
    setQty('');
    setNote('');
    setMessage(labels.wasteSaved);
  }

  return (
    <div className="space-y-4 py-4">
      <header className="flex h-14 items-center">
        <BackButton />
        <h1 className="text-[22px] font-extrabold">{labels.wasteTitle}</h1>
      </header>
      {message && <div className="rounded-2xl bg-[#EAF6EC] px-4 py-3 text-sm font-bold text-success">{message}</div>}
      <Card>
        <form className="grid gap-3" onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-2 rounded-2xl bg-surface-alt p-1">
            <button type="button" className={`rounded-xl px-3 py-3 text-sm font-bold ${mode === 'INGREDIENT' ? 'bg-white text-primary shadow-soft' : 'text-text-secondary'}`} onClick={() => setMode('INGREDIENT')}>{labels.wasteModeIngredient}</button>
            <button type="button" className={`rounded-xl px-3 py-3 text-sm font-bold ${mode === 'MENU' ? 'bg-white text-primary shadow-soft' : 'text-text-secondary'}`} onClick={() => setMode('MENU')}>{labels.wasteModeMenu}</button>
          </div>
          {mode === 'INGREDIENT' ? (
            <SelectInput label={labels.chooseIngredient} value={ingredientId} onChange={(e) => setIngredientId(e.target.value)}>
              {ingredients.map((item) => <option key={item.id} value={item.id}>{item.name} ({item.unit})</option>)}
            </SelectInput>
          ) : (
            <SelectInput label={labels.chooseMenu} value={menuId} onChange={(e) => setMenuId(e.target.value)}>
              {menus.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </SelectInput>
          )}
          <TextInput label={labels.qty} type="number" min="0" step="0.01" value={qty} onChange={(e) => setQty(e.target.value)} />
          <TextInput label={labels.note} value={note} onChange={(e) => setNote(e.target.value)} />
          {draft && (
            <div className="rounded-2xl bg-surface-alt p-3">
              <p className="text-sm font-bold text-text-secondary">{labels.estimatedLoss}</p>
              <p className="text-2xl font-extrabold text-danger">{formatRupiah(draft.estimatedLoss)}</p>
              {'ingredientUsages' in draft && (
                <div className="mt-2 space-y-1 text-sm font-semibold text-text-secondary">
                  {draft.ingredientUsages.map((usage) => <p key={usage.ingredientId}>{usage.ingredientName}: {formatQty(usage.qtyUsed)} {usage.unit}</p>)}
                </div>
              )}
            </div>
          )}
          <Button type="submit" className="w-full" disabled={!qty}>{labels.save}</Button>
        </form>
      </Card>
    </div>
  );
}
