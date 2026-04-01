// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Layout & Guards
import DashboardLayout from './components/shared/DashboardLayout';
import ProtectedRoute from './components/shared/ProtectedRoute';

// Pages — có sẵn
import LoginPage from './pages/LoginPage';
import TableVerifyPage from './pages/customer/TableVerifyPage';

// Pages — placeholder (thay dần bằng page thật)
import {
  MenuPage,
  OrderPage,
  StaffOrderPage,
  StaffTablePage,
  KitchenPage,
  AdminDashboardPage,
  AdminProductPage,
  AdminCategoryPage,
  AdminTablePage,
  AdminUserPage,
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
        <Route path="/menu" element={<MenuPage />} />
        <Route path="/orders" element={<OrderPage />} />

        {/* ── Staff ── */}
        <Route element={<ProtectedRoute roles={['staff', 'admin']} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/staff/orders" element={<StaffOrderPage />} />
            <Route path="/staff/tables" element={<StaffTablePage />} />
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
            <Route path="/admin/tables" element={<AdminTablePage />} />
            <Route path="/admin/users" element={<AdminUserPage />} />
          </Route>
        </Route>

        {/* ── 404 fallback ── */}
        <Route path="*" element={<Navigate to="/login" replace />} />

      </Routes>
    </BrowserRouter>
  );
}