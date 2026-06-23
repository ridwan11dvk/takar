import { useLiveQuery } from 'dexie-react-hooks';
import Card from '../components/ui/Card.jsx';
import { getReportSummary } from '../services/reportService.js';
import { formatQty, formatRupiah } from '../utils/format.js';
import { labels } from '../utils/labels.js';

export default function Report() {
  const report = useLiveQuery(() => getReportSummary(), []);

  const data = report ?? {
    todaySales: 0,
    totalHpp: 0,
    grossProfit: 0,
    averageHpp: 0,
    soldCount: 0,
    wasteValue: 0,
    soldItems: [],
    stockMovements: [],
    lowStock: [],
  };

  return (
    <div className="space-y-4 py-4">
      <header className="flex h-14 items-center">
        <h1 className="text-[22px] font-extrabold">{labels.reportTitle}</h1>
      </header>

      <Card>
        <h2 className="font-extrabold">{labels.salesReport}</h2>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div><p className="text-xs font-bold text-text-secondary">{labels.todaySales}</p><p className="text-xl font-extrabold">{formatRupiah(data.todaySales)}</p></div>
          <div><p className="text-xs font-bold text-text-secondary">{labels.totalHpp}</p><p className="text-xl font-extrabold">{formatRupiah(data.totalHpp)}</p></div>
          <div><p className="text-xs font-bold text-text-secondary">{labels.grossProfit}</p><p className="text-xl font-extrabold text-success">{formatRupiah(data.grossProfit)}</p></div>
          <div><p className="text-xs font-bold text-text-secondary">{labels.waste}</p><p className="text-xl font-extrabold text-danger">{formatRupiah(data.wasteValue)}</p></div>
        </div>
        <p className="mt-3 rounded-xl bg-surface-alt px-3 py-2 text-sm font-bold text-text-secondary">
          {labels.averageHpp}: {formatRupiah(data.averageHpp)} / item
        </p>
      </Card>

      <Card>
        <h2 className="font-extrabold">{labels.sold}</h2>
        <div className="mt-3 space-y-2">
          {data.soldItems.length === 0 && <p className="text-sm font-semibold text-text-muted">{labels.noData}</p>}
          {data.soldItems.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl bg-surface-alt px-3 py-2 text-sm font-bold">
              <span>{item.menuName} x{formatQty(item.qty)}</span>
              <span className="shrink-0">{formatRupiah(item.subtotal)}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="font-extrabold">{labels.movementAudit}</h2>
        <div className="mt-3 space-y-2">
          {data.stockMovements.length === 0 && <p className="text-sm font-semibold text-text-muted">{labels.noData}</p>}
          {data.stockMovements.map((movement) => (
            <div key={movement.id} className="rounded-xl bg-surface-alt px-3 py-2 text-sm">
              <div className="flex items-start justify-between gap-3 font-bold">
                <div>
                  <p>{movement.ingredientName}</p>
                  <p className="text-xs font-semibold text-text-secondary">
                    {movement.source} · {movement.type}
                    {movement.relatedNames?.length ? ` · ${movement.relatedNames.join(', ')}` : ''}
                  </p>
                </div>
                <span className={movement.qty < 0 ? 'shrink-0 text-danger' : 'shrink-0 text-success'}>
                  {movement.qty > 0 ? '+' : ''}{formatQty(movement.qty)} {movement.unit}
                </span>
              </div>
              <p className="font-semibold text-text-secondary">
                {labels.stockBeforeAfter}: {formatQty(movement.stockBefore)} {movement.unit} → {formatQty(movement.stockAfter)} {movement.unit}
                {movement.stockAfter < 0 ? ` (${labels.negativeStockNote})` : ''}
              </p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
