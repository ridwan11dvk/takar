import { BarChart3, Boxes, Home, MoreHorizontal, ShoppingBag } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { labels } from '../../utils/labels.js';

const items = [
  { to: '/dashboard', label: labels.dashboard, icon: Home },
  { to: '/sales', label: labels.sales, icon: ShoppingBag },
  { to: '/ingredients', label: labels.ingredients, icon: Boxes },
  { to: '/reports', label: labels.reports, icon: BarChart3 },
  { to: '/more', label: labels.more, icon: MoreHorizontal },
];

export default function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-white px-1.5 pb-3 pt-2">
      <div className="mx-auto flex max-w-3xl">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex min-h-12 flex-1 flex-col items-center justify-center gap-1 text-[11px] font-semibold ${
                isActive ? 'text-primary' : 'text-[#AAA095]'
              }`
            }
          >
            <item.icon size={23} strokeWidth={2.2} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
