import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import BackButton from '../components/layout/BackButton.jsx';
import Button from '../components/ui/Button.jsx';
import Card from '../components/ui/Card.jsx';
import SelectInput from '../components/ui/SelectInput.jsx';
import TextInput from '../components/ui/TextInput.jsx';
import { listIngredients, restockIngredient } from '../services/ingredientService.js';
import { formatQty, formatRupiah } from '../utils/format.js';
import { labels } from '../utils/labels.js';

export default function Restock() {
  const ingredients = useLiveQuery(() => listIngredients(), []) ?? [];
  const [ingredientId, setIngredientId] = useState('');
  const [qtyIn, setQtyIn] = useState('');
  const [purchaseTotalPrice, setPurchaseTotalPrice] = useState('');
  const [note, setNote] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!ingredientId && ingredients[0]) setIngredientId(String(ingredients[0].id));
  }, [ingredientId, ingredients]);

  const ingredient = ingredients.find((item) => item.id === Number(ingredientId));

  async function handleSubmit(event) {
    event.preventDefault();
    await restockIngredient({ ingredientId, qtyIn, purchaseTotalPrice, note });
    setQtyIn('');
    setPurchaseTotalPrice('');
    setNote('');
    setMessage(labels.restockSaved);
  }

  return (
    <div className="space-y-4 py-4">
      <header className="flex h-14 items-center">
        <BackButton />
        <h1 className="text-[22px] font-extrabold">{labels.restockTitle}</h1>
      </header>
      {message && <div className="rounded-2xl bg-[#EAF6EC] px-4 py-3 text-sm font-bold text-success">{message}</div>}
      <Card>
        <form className="grid gap-3" onSubmit={handleSubmit}>
          <SelectInput label={labels.chooseIngredient} value={ingredientId} onChange={(e) => setIngredientId(e.target.value)}>
            {ingredients.map((item) => <option key={item.id} value={item.id}>{item.name} ({item.unit})</option>)}
          </SelectInput>
          {ingredient && (
            <div className="rounded-2xl bg-surface-alt p-3 text-sm font-bold text-text-secondary">
              {labels.currentStock}: {formatQty(ingredient.currentStock)} {ingredient.unit} · {labels.avgCostPerUnit}: {formatRupiah(ingredient.avgCostPerUnit)}
            </div>
          )}
          <TextInput label={labels.qty} type="number" min="0" step="0.01" value={qtyIn} onChange={(e) => setQtyIn(e.target.value)} />
          <TextInput label={labels.purchaseTotalPrice} type="number" min="0" value={purchaseTotalPrice} onChange={(e) => setPurchaseTotalPrice(e.target.value)} />
          <TextInput label={labels.note} value={note} onChange={(e) => setNote(e.target.value)} />
          <Button type="submit" className="w-full" disabled={!ingredientId || !qtyIn || !purchaseTotalPrice}>{labels.save}</Button>
        </form>
      </Card>
    </div>
  );
}
