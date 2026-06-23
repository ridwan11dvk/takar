import { AlertTriangle, Check, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import Badge from '../components/ui/Badge.jsx';
import Button from '../components/ui/Button.jsx';
import Card from '../components/ui/Card.jsx';
import { getDashboardSummary } from '../services/reportService.js';
import { getSettings } from '../services/settingsService.js';
import { downloadBackup, exportBackup } from '../services/backupService.js';
import { getStockStatus } from '../domain/inventory.js';
import { formatQty, formatRupiah } from '../utils/format.js';
import { labels } from '../utils/labels.js';

export default function Dashboard() {
  const summary = useLiveQuery(() => getDashboardSummary(), []);
  const settings = useLiveQuery(() => getSettings(), []);

  async function handleExport() {
    downloadBackup(await exportBackup());
  }

  const data = summary ?? {
    todaySales: 0,
    grossProfit: 0,
    soldCount: 0,
    wasteValue: 0,
    lowStock: [],
  };

  return (
    <div className="space-y-4 py-4">
      <header className="flex h-14 items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-lg font-extrabold text-white">
            T
          </div>
          <div>
            <p className="text-xl font-extrabold">{labels.appName} · {settings?.storeName ?? labels.storeName}</p>
            <p className="text-xs font-semibold text-text-muted">{labels.backupReminder}</p>
          </div>
        </div>
        <Link to="/settings" aria-label={labels.settingsTitle} className="grid h-11 w-11 shrink-0 place-items-center rounded-xl">
          <Settings className="text-text-secondary" size={22} />
        </Link>
      </header>

      <Card>
        <p className="text-sm font-semibold text-text-secondary">{labels.todaySales}</p>
        <p className="mt-1 text-[40px] font-extrabold leading-tight tracking-[-1px]">
          {formatRupiah(data.todaySales)}
        </p>
        <span className="mt-2 inline-flex rounded-full bg-[#E6F4EA] px-3 py-1 text-xs font-bold text-success">
          {labels.grossProfit} {formatRupiah(data.grossProfit)}
        </span>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Card>
          <p className="text-sm font-semibold text-text-secondary">{labels.sold}</p>
          <p className="mt-1 text-3xl font-extrabold">{formatQty(data.soldCount)}</p>
        </Card>
        <Card>
          <p className="text-sm font-semibold text-text-secondary">{labels.waste}</p>
          <p className="mt-1 text-3xl font-extrabold text-danger">{formatRupiah(data.wasteValue)}</p>
        </Card>
      </div>

      <Card className={data.lowStock.length > 0 ? 'border-[#F0DCA0] bg-[#FCF4DD]' : 'border-[#C9E7CF] bg-[#EAF6EC]'}>
        <div className="mb-3 flex items-center gap-2">
          {data.lowStock.length > 0 ? (
            <AlertTriangle className="text-warning" size={20} />
          ) : (
            <Check className="text-success" size={20} />
          )}
          <h2 className={`font-extrabold ${data.lowStock.length > 0 ? 'text-[#7A4D11]' : 'text-success'}`}>
            {data.lowStock.length > 0
              ? `${labels.lowStock} (${data.lowStock.length})`
              : labels.allStockSafe}
          </h2>
        </div>
        <div className="space-y-2">
          {data.lowStock.slice(0, 4).map((ingredient) => {
            const status = getStockStatus(ingredient);
            return (
              <div key={ingredient.id} className="flex items-center justify-between rounded-xl bg-white/60 px-3 py-2">
                <span className="font-bold">
                  {ingredient.name} {formatQty(ingredient.currentStock)} {ingredient.unit}
                </span>
                <Badge label={status.label} tone={status.tone} />
              </div>
            );
          })}
        </div>
      </Card>

      <Link to="/sales" className="block">
        <Button className="w-full">{labels.quickSale}</Button>
      </Link>
      <button className="w-full text-sm font-bold text-primary" type="button" onClick={handleExport}>
        {labels.exportData}
      </button>
    </div>
  );
}
