import { useEffect, useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import BackButton from '../components/layout/BackButton.jsx';
import Button from '../components/ui/Button.jsx';
import Card from '../components/ui/Card.jsx';
import SelectInput from '../components/ui/SelectInput.jsx';
import TextInput from '../components/ui/TextInput.jsx';
import { calculateStockCountDraft } from '../domain/inventory.js';
import { listIngredients } from '../services/ingredientService.js';
import { saveStockCount } from '../services/stockCountService.js';
import { formatQty } from '../utils/format.js';
import { labels } from '../utils/labels.js';

export default function StockCount() {
  const ingredients = useLiveQuery(() => listIngredients(), []) ?? [];
  const [ingredientId, setIngredientId] = useState('');
  const [actualStock, setActualStock] = useState('');
  const [note, setNote] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!ingredientId && ingredients[0]) setIngredientId(String(ingredients[0].id));
  }, [ingredientId, ingredients]);

  const ingredient = ingredients.find((item) => item.id === Number(ingredientId));
  const draft = useMemo(() => {
    if (!ingredient || actualStock === '') return null;
    return calculateStockCountDraft({ ingredient, actualStock: Number(actualStock) });
  }, [actualStock, ingredient]);

  async function handleSubmit(event) {
    event.preventDefault();
    await saveStockCount({ ingredientId, actualStock, note });
    setActualStock('');
    setNote('');
    setMessage(labels.stockCountSaved);
  }

  return (
    <div className="space-y-4 py-4">
      <header className="flex h-14 items-center">
        <BackButton />
        <h1 className="text-[22px] font-extrabold">{labels.stockCountTitle}</h1>
      </header>
      {message && <div className="rounded-2xl bg-[#EAF6EC] px-4 py-3 text-sm font-bold text-success">{message}</div>}
      <Card>
        <form className="grid gap-3" onSubmit={handleSubmit}>
          <SelectInput label={labels.chooseIngredient} value={ingredientId} onChange={(e) => setIngredientId(e.target.value)}>
            {ingredients.map((item) => <option key={item.id} value={item.id}>{item.name} ({item.unit})</option>)}
          </SelectInput>
          {ingredient && <div className="rounded-2xl bg-surface-alt p-3 font-bold">{labels.systemStock}: {formatQty(ingredient.currentStock)} {ingredient.unit}</div>}
          <TextInput label={labels.actualStock} type="number" step="0.01" value={actualStock} onChange={(e) => setActualStock(e.target.value)} />
          <TextInput label={labels.note} value={note} onChange={(e) => setNote(e.target.value)} />
          {draft && (
            <div className="rounded-2xl bg-surface-alt p-3">
              <p className="text-sm font-bold text-text-secondary">{labels.difference}</p>
              <p className={`text-2xl font-extrabold ${draft.difference < 0 ? 'text-danger' : 'text-success'}`}>{formatQty(draft.difference)} {draft.unit}</p>
            </div>
          )}
          <Button type="submit" className="w-full" disabled={actualStock === ''}>{labels.save}</Button>
        </form>
      </Card>
    </div>
  );
}
