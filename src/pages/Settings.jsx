import { useEffect, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import BackButton from '../components/layout/BackButton.jsx';
import Button from '../components/ui/Button.jsx';
import Card from '../components/ui/Card.jsx';
import TextInput from '../components/ui/TextInput.jsx';
import { seedDatabase } from '../db/seed.js';
import { downloadBackup, exportBackup, importBackup } from '../services/backupService.js';
import { ensureSettings, getSettings, updateSettings } from '../services/settingsService.js';
import { labels } from '../utils/labels.js';

export default function Settings() {
  const settings = useLiveQuery(() => getSettings(), []);
  const fileInputRef = useRef(null);
  const [storeName, setStoreName] = useState('');
  const [lowStockAlert, setLowStockAlert] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    ensureSettings().catch((error) => console.error(error));
  }, []);

  useEffect(() => {
    if (!settings) return;
    setStoreName(settings.storeName);
    setLowStockAlert(settings.lowStockAlert);
  }, [settings]);

  async function handleSave(event) {
    event.preventDefault();
    await updateSettings({ storeName, currency: 'IDR', lowStockAlert });
    setMessage(labels.initialDataSaved);
  }

  async function handleExport() {
    downloadBackup(await exportBackup());
    setMessage(labels.exportSuccess);
  }

  async function handleImport(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!window.confirm(labels.backupOverwriteWarning)) return;

    const text = await file.text();
    await importBackup(JSON.parse(text));
    setMessage(labels.importSuccess);
    event.target.value = '';
  }

  async function handleSeedSampleData() {
    await seedDatabase();
    setMessage(labels.sampleDataLoaded);
  }

  return (
    <div className="space-y-4 py-4">
      <header className="flex h-14 items-center">
        <BackButton />
        <h1 className="text-[22px] font-extrabold">{labels.settingsTitle}</h1>
      </header>

      {message && <div className="rounded-2xl bg-[#EAF6EC] px-4 py-3 text-sm font-bold text-success">{message}</div>}

      <Card>
        <form className="grid gap-3" onSubmit={handleSave}>
          <TextInput label={labels.storeNameLabel} value={storeName} onChange={(e) => setStoreName(e.target.value)} />
          <label className="flex items-center justify-between rounded-2xl bg-surface-alt px-4 py-3 font-bold">
            <span>{labels.lowStockAlert}</span>
            <input type="checkbox" checked={lowStockAlert} onChange={(e) => setLowStockAlert(e.target.checked)} />
          </label>
          <Button type="submit" className="w-full">{labels.save}</Button>
        </form>
      </Card>

      <Card className="space-y-3">
        <div>
          <h2 className="font-extrabold">{labels.backupTitle}</h2>
          <p className="mt-1 text-sm font-semibold text-text-secondary">{labels.backupDescription}</p>
        </div>
        <Button className="w-full" onClick={handleExport}>{labels.exportData}</Button>
      </Card>

      <Card className="space-y-3">
        <div>
          <h2 className="font-extrabold">{labels.restoreTitle}</h2>
          <p className="mt-1 text-sm font-semibold text-text-secondary">{labels.restoreDescription}</p>
        </div>
        <input
          ref={fileInputRef}
          className="hidden"
          type="file"
          accept="application/json"
          onChange={handleImport}
        />
        <Button variant="secondary" className="w-full" onClick={() => fileInputRef.current?.click()}>
          {labels.importData}
        </Button>
        <p className="text-xs font-semibold text-text-muted">{labels.chooseFile}</p>
      </Card>

      <Card className="space-y-3">
        <div>
          <h2 className="font-extrabold">{labels.sampleDataTitle}</h2>
          <p className="mt-1 text-sm font-semibold text-text-secondary">{labels.sampleDataDescription}</p>
        </div>
        <Button variant="secondary" className="w-full" onClick={handleSeedSampleData}>
          {labels.loadSampleData}
        </Button>
      </Card>
    </div>
  );
}
