import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import BackButton from '../components/layout/BackButton.jsx';
import Button from '../components/ui/Button.jsx';
import Card from '../components/ui/Card.jsx';
import Modal from '../components/ui/Modal.jsx';
import TextInput from '../components/ui/TextInput.jsx';
import { CategoryType } from '../domain/category.js';
import { createCategory, deleteCategory, ensureDefaultCategories, listCategories, restoreDefaultCategories, updateCategory } from '../services/categoryService.js';
import { labels } from '../utils/labels.js';

export default function Categories() {
  const ingredientCategories = useLiveQuery(() => listCategories(CategoryType.INGREDIENT), []) ?? [];
  const menuCategories = useLiveQuery(() => listCategories(CategoryType.MENU), []) ?? [];
  const [forms, setForms] = useState({ [CategoryType.INGREDIENT]: '', [CategoryType.MENU]: '' });
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    ensureDefaultCategories().catch((error) => {
      console.error(error);
    });
  }, []);

  async function handleSubmit(event, type) {
    event.preventDefault();
    const name = forms[type];
    if (!name.trim()) return;

    if (editing?.type === type) {
      const result = await updateCategory(editing.id, { name });
      if (!result.ok) {
        setMessage(result.reason === 'DUPLICATE' ? labels.categoryDuplicate : labels.categoryInUse);
        return;
      }
      setEditing(null);
    } else {
      await createCategory({ name, type });
    }

    setForms((current) => ({ ...current, [type]: '' }));
    setMessage(labels.initialDataSaved);
  }

  function handleEdit(category) {
    setEditing(category);
    setForms((current) => ({ ...current, [category.type]: category.name }));
  }

  async function handleDeleteConfirmed() {
    if (!deleteTarget) return;
    const result = await deleteCategory(deleteTarget.id);
    setMessage(result.ok ? `${labels.categoryDeleted} ${result.replacementName}.` : labels.categoryInUse);
    setDeleteTarget(null);
  }

  async function handleRestoreDefaults() {
    await restoreDefaultCategories();
    setMessage(labels.defaultCategoriesRestored);
  }

  function renderSection(title, type, categories) {
    return (
      <Card className="space-y-3">
        <h2 className="font-extrabold">{title}</h2>
        <form className="grid gap-2" onSubmit={(event) => handleSubmit(event, type)}>
          <TextInput
            label={labels.categoryName}
            value={forms[type]}
            onChange={(event) => setForms((current) => ({ ...current, [type]: event.target.value }))}
          />
          {!editing && <Button type="submit" disabled={!forms[type].trim()}>{labels.addCategory}</Button>}
        </form>
        <div className="space-y-2">
          {categories.map((category) => (
            <div key={category.id} className="flex items-center justify-between gap-3 rounded-2xl bg-surface-alt px-4 py-3">
              <span className="font-bold">{category.name}</span>
              <span className="flex gap-2">
                <button type="button" className="rounded-xl border border-border bg-white px-3 py-2 text-sm font-bold text-primary" onClick={() => handleEdit(category)}>
                  {labels.edit}
                </button>
                <button type="button" className="rounded-xl border border-border bg-white px-3 py-2 text-sm font-bold text-danger" onClick={() => setDeleteTarget(category)}>
                  {labels.delete}
                </button>
              </span>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4 py-4">
      <header className="flex h-14 items-center">
        <BackButton />
        <h1 className="text-[22px] font-extrabold">{labels.categoriesTitle}</h1>
      </header>
      {message && <div className="rounded-2xl bg-[#EAF6EC] px-4 py-3 text-sm font-bold text-success">{message}</div>}
      <Button variant="secondary" onClick={handleRestoreDefaults}>{labels.restoreDefaultCategories}</Button>
      {renderSection(labels.ingredientCategories, CategoryType.INGREDIENT, ingredientCategories)}
      {renderSection(labels.menuCategories, CategoryType.MENU, menuCategories)}
      {editing && (
        <Modal title={labels.editCategory} onClose={() => setEditing(null)}>
          <form className="grid gap-3" onSubmit={(event) => handleSubmit(event, editing.type)}>
            <TextInput
              label={labels.categoryName}
              value={forms[editing.type]}
              onChange={(event) => setForms((current) => ({ ...current, [editing.type]: event.target.value }))}
            />
            <div className="grid grid-cols-2 gap-2">
              <Button type="submit" disabled={!forms[editing.type].trim()}>{labels.save}</Button>
              <Button variant="secondary" onClick={() => setEditing(null)}>{labels.cancel}</Button>
            </div>
          </form>
        </Modal>
      )}
      {deleteTarget && (
        <Modal title={labels.confirmDelete} onClose={() => setDeleteTarget(null)}>
          <p className="font-bold">{labels.deleteCategoryConfirm}</p>
          <p className="mt-1 text-sm font-semibold text-text-secondary">{deleteTarget.name} · {labels.deleteWarning}</p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>{labels.cancel}</Button>
            <Button variant="warning" onClick={handleDeleteConfirmed}>{labels.yesDelete}</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
