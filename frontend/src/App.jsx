// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Layout & Guards
import DashboardLayout from './components/shared/DashboardLayout';
import ProtectedRoute from './components/shared/ProtectedRoute';

// Pages — có sẵn
import LoginPage from './pages/LoginPage';
import TableVerifyPage from './pages/customer/TableVerifyPage';

//Customer
import HomePage from './pages/customer/HomePage';
import MenuPage from './pages/customer/MenuPage';
import OrderPage from './pages/customer/OrderPage';
import StaffOrdersPage from './pages/staff/StaffOrdersPage';
import StaffServingPage from './pages/staff/StaffServingPage';
import StaffTablesPage from './pages/staff/StaffTablesPage';
import KitchenPage from './pages/kitchen/KitchenPage';

//Admin
import AdminTablesPage from './pages/admin/AdminTablesPage';
import AdminProductPage from './pages/admin/AdminProductPage';
import AdminCategoryPage from './pages/admin/AdminCategoryPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';

// Pages — placeholder (thay dần bằng page thật)
import {
  AdminDashboardPage,
} from './pages/PlaceholderPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ── Public ── */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />

        {/* ── Customer (QR) — không cần login ── */}
        <Route path="/table/:token" element={<TableVerifyPage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/menu" element={<MenuPage />} />
        <Route path="/orders" element={<OrderPage />} />

        {/* ── Staff ── */}
        <Route element={<ProtectedRoute roles={['staff', 'admin']} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/staff/orders" element={<StaffOrdersPage />} />
            <Route path="/staff/serving" element={<StaffServingPage />} />
            <Route path="/staff/tables" element={<StaffTablesPage />} />
          </Route>
        </Route>

        {/* ── Kitchen ── */}
        <Route element={<ProtectedRoute roles={['kitchen', 'admin']} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/kitchen" element={<KitchenPage />} />
          </Route>
        </Route>

        {/* ── Admin ── */}
        <Route element={<ProtectedRoute roles={['admin']} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/admin/products" element={<AdminProductPage />} />
            <Route path="/admin/categories" element={<AdminCategoryPage />} />
            <Route path="/admin/tables" element={<AdminTablesPage />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
          </Route>
        </Route>

        {/* ── 404 fallback ── */}
        <Route path="*" element={<Navigate to="/login" replace />} />

      </Routes>
    </BrowserRouter>
  );
}
