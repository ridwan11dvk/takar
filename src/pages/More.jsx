import { Link } from 'react-router-dom';
import { ChefHat, ClipboardCheck, FolderTree, PackagePlus, Settings, Trash2, Utensils } from 'lucide-react';
import Card from '../components/ui/Card.jsx';
import { labels } from '../utils/labels.js';

const menuItems = [
  { label: labels.menus, description: labels.menusDescription, to: '/menus', icon: Utensils },
  { label: labels.categoriesTitle, description: labels.categoriesDescription, to: '/categories', icon: FolderTree },
  { label: labels.recipes, description: labels.recipesDescription, to: '/recipes', icon: ChefHat },
  { label: labels.restock, description: labels.restockDescription, to: '/restock', icon: PackagePlus },
  { label: labels.waste, description: labels.wasteDescription, to: '/waste', icon: Trash2 },
  { label: labels.stockCount, description: labels.stockCountDescription, to: '/stock-count', icon: ClipboardCheck },
  { label: labels.settings, description: labels.settingsDescription, to: '/settings', icon: Settings },
];

export default function More() {
  return (
    <div className="space-y-4 py-4">
      <header className="flex h-14 items-center">
        <h1 className="text-[22px] font-extrabold">{labels.more}</h1>
      </header>
      <Card>
        <h2 className="text-lg font-extrabold">{labels.moreTitle}</h2>
        <p className="mt-1 text-sm font-semibold text-text-secondary">{labels.moreSubtitle}</p>
        <div className="mt-4 grid gap-3">
          {menuItems.map((page) => (
            <Link
              key={page.to}
              to={page.to}
              className="flex items-center gap-3 rounded-2xl bg-surface-alt px-4 py-3"
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white text-primary shadow-soft">
                <page.icon size={21} />
              </span>
              <span className="min-w-0">
                <span className="block font-extrabold">{page.label}</span>
                <span className="mt-0.5 block text-sm font-semibold text-text-secondary">{page.description}</span>
              </span>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}
