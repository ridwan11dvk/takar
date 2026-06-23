import { Navigate, Route, Routes } from 'react-router-dom';
import AppShell from './components/layout/AppShell.jsx';
import Categories from './pages/Categories.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Ingredients from './pages/Ingredients.jsx';
import Menus from './pages/Menus.jsx';
import More from './pages/More.jsx';
import Recipe from './pages/Recipe.jsx';
import Report from './pages/Report.jsx';
import Restock from './pages/Restock.jsx';
import Sales from './pages/Sales.jsx';
import Settings from './pages/Settings.jsx';
import StockCount from './pages/StockCount.jsx';
import Waste from './pages/Waste.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/sales" element={<Sales />} />
        <Route path="/ingredients" element={<Ingredients />} />
        <Route path="/reports" element={<Report />} />
        <Route path="/menus" element={<Menus />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/recipes" element={<Recipe />} />
        <Route path="/restock" element={<Restock />} />
        <Route path="/waste" element={<Waste />} />
        <Route path="/stock-count" element={<StockCount />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/more" element={<More />} />
      </Route>
    </Routes>
  );
}
