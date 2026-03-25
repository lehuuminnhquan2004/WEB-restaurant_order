import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import CustomerLayout from '../layouts/CustomerLayout'
import StaffLayout from '../layouts/StaffLayout'
import KitchenLayout from '../layouts/KitchenLayout'
import AdminLayout from '../layouts/AdminLayout'

import RequireAuth from '../components/guards/RequireAuth'
import RequireTableAccess from '../components/guards/RequireTableAccess'

import LoginPage from '../modules/auth/pages/LoginPage'

import CustomerAccessPage from '../modules/customer/pages/CustomerAccessPage'
import MenuPage from '../modules/customer/pages/MenuPage'
import CartPage from '../modules/customer/pages/CartPage'
import OrderTrackingPage from '../modules/customer/pages/OrderTrackingPage'

import StaffDashboardPage from '../modules/staff/pages/DashboardPage'
import StaffOrdersPage from '../modules/staff/pages/OrdersPage'
import StaffTablesPage from '../modules/staff/pages/TablesPage'

import KitchenOrdersPage from '../modules/kitchen/pages/KitchenOrdersPage'
import KitchenDetailPage from '../modules/kitchen/pages/KitchenDetailPage'

import AdminDashboardPage from '../modules/admin/pages/DashboardPage'
import ProductsPage from '../modules/admin/pages/ProductsPage'
import CategoriesPage from '../modules/admin/pages/CategoriesPage'
import AdminTablesPage from '../modules/admin/pages/TablesPage'

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />

        <Route path="/customer" element={<CustomerLayout />}>
          <Route path="access/:token" element={<CustomerAccessPage />} />

          <Route element={<RequireTableAccess />}>
            <Route path="menu" element={<MenuPage />} />
            <Route path="cart" element={<CartPage />} />
            <Route path="orders" element={<OrderTrackingPage />} />
          </Route>
        </Route>

        <Route element={<RequireAuth roles={['staff', 'admin']} />}>
          <Route path="/staff" element={<StaffLayout />}>
            <Route index element={<StaffDashboardPage />} />
            <Route path="orders" element={<StaffOrdersPage />} />
            <Route path="tables" element={<StaffTablesPage />} />
          </Route>
        </Route>

        <Route element={<RequireAuth roles={['staff', 'admin']} />}>
          <Route path="/kitchen" element={<KitchenLayout />}>
            <Route index element={<KitchenOrdersPage />} />
            <Route path="orders/:id" element={<KitchenDetailPage />} />
          </Route>
        </Route>

        <Route element={<RequireAuth roles={['admin']} />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboardPage />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="categories" element={<CategoriesPage />} />
            <Route path="tables" element={<AdminTablesPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}