import { AlertTriangle, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import Button from '../components/ui/Button.jsx';
import Card from '../components/ui/Card.jsx';
import QtyStepper from '../components/ui/QtyStepper.jsx';
import { calculateSaleDraft } from '../domain/inventory.js';
import { getSaleEntryData, saveSale } from '../services/saleService.js';
import { formatRupiah } from '../utils/format.js';
import { labels } from '../utils/labels.js';

export default function Sales() {
  const [cart, setCart] = useState([]);
  const [message, setMessage] = useState('');
  const data = useLiveQuery(() => getSaleEntryData(), []);

  const menus = data?.menus ?? [];
  const recipes = data?.recipes ?? [];
  const ingredients = data?.ingredients ?? [];

  const recipeMenuIds = useMemo(() => new Set(recipes.map((recipe) => recipe.menuId)), [recipes]);
  const draft = useMemo(() => {
    if (cart.length === 0 || !data) return null;
    return calculateSaleDraft({ cart, menus, recipes, ingredients });
  }, [cart, data, ingredients, menus, recipes]);

  function addToCart(menu) {
    if (!recipeMenuIds.has(menu.id) && !window.confirm(labels.recipeMissingConfirm)) {
      return;
    }
    setMessage('');
    setCart((current) => {
      const existing = current.find((item) => item.menuId === menu.id);
      if (existing) {
        return current.map((item) => (item.menuId === menu.id ? { ...item, qty: item.qty + 1 } : item));
      }
      return [...current, { menuId: menu.id, qty: 1 }];
    });
  }

  function updateQty(menuId, delta) {
    setCart((current) =>
      current
        .map((item) => (item.menuId === menuId ? { ...item, qty: item.qty + delta } : item))
        .filter((item) => item.qty > 0),
    );
  }

  async function handleSave() {
    if (cart.length === 0) return;
    await saveSale({ cart });
    setCart([]);
    setMessage(labels.saleSaved);
  }

  return (
    <div className="space-y-4 py-4">
      <header className="flex h-14 items-center justify-between">
        <h1 className="text-[22px] font-extrabold">{labels.sales}</h1>
        <span className="rounded-full bg-white px-3 py-2 text-sm font-extrabold text-primary shadow-soft">
          {labels.total}: {formatRupiah(draft?.totalAmount ?? 0)}
        </span>
      </header>

      {message && (
        <div className="rounded-2xl border border-[#C9E7CF] bg-[#EAF6EC] px-4 py-3 text-sm font-bold text-success">
          {message}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {menus.map((menu) => (
          <Card key={menu.id} className="flex min-h-[118px] flex-col">
            <h2 className="text-[15px] font-bold">{menu.name}</h2>
            {!recipeMenuIds.has(menu.id) && (
              <span className="mt-1 w-fit rounded-full bg-[#FCEFD6] px-2 py-1 text-[10px] font-bold text-warning">
                {labels.recipeMissing}
              </span>
            )}
            <p className="mt-2 text-sm font-semibold text-text-secondary">{formatRupiah(menu.sellingPrice)}</p>
            <button
              type="button"
              className="mt-auto grid h-[46px] w-[46px] place-items-center self-end rounded-2xl bg-primary text-white shadow-primary"
              onClick={() => addToCart(menu)}
              aria-label={`${labels.sales} ${menu.name}`}
            >
              <Plus size={25} strokeWidth={3} />
            </button>
          </Card>
        ))}
      </div>

      <Card className="sticky bottom-24 z-10 space-y-3 shadow-sheet">
        {cart.length === 0 ? (
          <p className="py-4 text-center text-sm font-semibold text-text-muted">{labels.emptyCart}</p>
        ) : (
          <>
            {draft?.stockWarnings.length > 0 && (
              <div className="rounded-2xl border border-[#F0DCA0] bg-[#FCF4DD] p-3 text-sm text-[#7A4D11]">
                <div className="flex gap-2 font-extrabold">
                  <AlertTriangle size={18} />
                  <span>{labels.stockWarning}</span>
                </div>
                <p className="mt-1 font-semibold">
                  {draft.stockWarnings[0].ingredientName} {labels.notEnoughStock}
                </p>
              </div>
            )}

            <div className="space-y-3">
              {draft?.items.map((item) => (
                <div key={item.menuId} className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-bold">{item.menuName}</p>
                    <p className="text-xs font-semibold text-text-secondary">{formatRupiah(item.priceAtSale)}</p>
                  </div>
                  <QtyStepper
                    value={item.qty}
                    onDecrease={() => updateQty(item.menuId, -1)}
                    onIncrease={() => updateQty(item.menuId, 1)}
                  />
                  <p className="min-w-20 text-right font-extrabold">{formatRupiah(item.subtotal)}</p>
                </div>
              ))}
            </div>

            <div className="border-t border-dashed border-[#E4DACE] pt-3">
              <p className="text-sm font-semibold text-text-secondary">{labels.total}</p>
              <p className="text-[26px] font-extrabold">{formatRupiah(draft?.totalAmount ?? 0)}</p>
            </div>
          </>
        )}
        <Button className="w-full" disabled={cart.length === 0} onClick={handleSave}>
          {draft?.stockWarnings.length > 0 ? labels.keepSave : labels.saveSale}
        </Button>
      </Card>
    </div>
  );
}
