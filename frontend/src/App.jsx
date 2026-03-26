import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import useAuthStore from './store/authStore'

// Auth
import LoginPage from './pages/LoginPage'

// Customer
import TableVerifyPage from './pages/customer/TableVerifyPage'
import MenuPage from './pages/customer/MenuPage'
import OrderPage from './pages/customer/OrderPage'

// Staff
import StaffOrderPage from './pages/staff/StaffOrderPage'
import StaffTablePage from './pages/staff/StaffTablePage'

// Kitchen
import KitchenPage from './pages/kitchen/KitchenPage'

// Admin
import AdminProductPage from './pages/admin/AdminProductPage'
import AdminCategoryPage from './pages/admin/AdminCategoryPage'
import AdminTablePage from './pages/admin/AdminTablePage'

// Shared
import ProtectedRoute from './components/shared/ProtectedRoute'

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Mặc định → Login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Khách quét QR — public, không cần đăng nhập */}
        <Route path="/table/:token" element={<TableVerifyPage />} />
        <Route path="/menu" element={<MenuPage />} />
        <Route path="/order" element={<OrderPage />} />

        {/* Staff */}
        <Route element={<ProtectedRoute allowedRoles={['staff', 'admin']} />}>
          <Route path="/staff/orders" element={<StaffOrderPage />} />
          <Route path="/staff/tables" element={<StaffTablePage />} />
        </Route>

        {/* Kitchen */}
        <Route element={<ProtectedRoute allowedRoles={['kitchen', 'admin']} />}>
          <Route path="/kitchen" element={<KitchenPage />} />
        </Route>

        {/* Admin */}
        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
          <Route path="/admin/products" element={<AdminProductPage />} />
          <Route path="/admin/categories" element={<AdminCategoryPage />} />
          <Route path="/admin/tables" element={<AdminTablePage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />

      </Routes>
    </BrowserRouter>
  )
}

export default App  