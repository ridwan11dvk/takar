import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import BackButton from '../components/layout/BackButton.jsx';
import Badge from '../components/ui/Badge.jsx';
import Button from '../components/ui/Button.jsx';
import Card from '../components/ui/Card.jsx';
import Modal from '../components/ui/Modal.jsx';
import SelectInput from '../components/ui/SelectInput.jsx';
import TextInput from '../components/ui/TextInput.jsx';
import { CategoryType } from '../domain/category.js';
import { ensureDefaultCategories, listCategories } from '../services/categoryService.js';
import { createMenu, deleteOrDeactivateMenu, listMenus, updateMenu } from '../services/menuService.js';
import { formatRupiah } from '../utils/format.js';
import { labels } from '../utils/labels.js';

const initialForm = { name: '', category: 'Minuman', sellingPrice: '' };

export default function Menus() {
  const menus = useLiveQuery(() => listMenus(), []) ?? [];
  const categoryOptions = useLiveQuery(() => listCategories(CategoryType.MENU), []) ?? [];
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [message, setMessage] = useState('');

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

  async function handleSubmit(event) {
    event.preventDefault();
    if (!form.name.trim()) return;
    if (editingId) {
      await updateMenu(editingId, {
        name: form.name.trim(),
        category: form.category.trim(),
        sellingPrice: Number(form.sellingPrice) || 0,
        isActive: true,
      });
    } else {
      await createMenu(form);
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
    });
  }

  async function handleDelete(menu) {
    const result = await deleteOrDeactivateMenu(menu.id);
    setMessage(result.mode === 'deleted' ? labels.menuDeleted : labels.menuDeactivated);
    setDeleteTarget(null);
  }

  return (
    <div className="space-y-4 py-4">
      <header className="flex h-14 items-center">
        <BackButton />
        <h1 className="text-[22px] font-extrabold">{labels.menuList}</h1>
      </header>

      {message && <div className="rounded-2xl bg-[#EAF6EC] px-4 py-3 text-sm font-bold text-success">{message}</div>}

      <Card>
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
          <Button type="submit" className="w-full">{labels.addMenu}</Button>
        </form>
      </Card>

      <div className="space-y-3">
        {menus.map((menu) => (
          <Card key={menu.id} className="flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold">{menu.name}</h2>
                <Badge label={menu.isActive ? labels.active : labels.inactive} tone={menu.isActive ? 'success' : 'danger'} />
              </div>
              <p className="mt-1 text-sm font-semibold text-text-secondary">{menu.category}</p>
              <p className="mt-1 text-lg font-extrabold">{formatRupiah(menu.sellingPrice)}</p>
            </div>
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
