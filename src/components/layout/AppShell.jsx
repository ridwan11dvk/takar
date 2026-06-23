import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav.jsx';

export default function AppShell() {
  return (
    <div className="min-h-screen bg-bg pb-24 text-text">
      <div className="mx-auto min-h-screen max-w-3xl px-4">
        <Outlet />
      </div>
      <BottomNav />
    </div>
  );
}
