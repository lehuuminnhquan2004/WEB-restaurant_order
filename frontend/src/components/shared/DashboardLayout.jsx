// src/components/shared/DashboardLayout.jsx
import { useEffect } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { NavLink } from 'react-router-dom';

// react-icons/fi
import {
  FiGrid,
  FiList,
  FiUsers,
  FiShoppingBag,
  FiCoffee,
  FiTag,
  FiLogOut,
} from 'react-icons/fi';

import { MdTableRestaurant } from 'react-icons/md';

import useAuthStore from '../../store/authStore';
import '../../styles/DashboardLayout.css';

/* ─── Menu config theo role ─── */
const NAV_CONFIG = {
  staff: [
    {
      section: 'Quản lý',
      items: [
        { label: 'Đơn hàng',   icon: <FiList />,       path: '/staff/orders' },
        { label: 'Phục vụ',    icon: <FiCoffee />,     path: '/staff/serving' },
        { label: 'Bàn',        icon: <MdTableRestaurant />, path: '/staff/tables' },
      ],
    },
  ],
  kitchen: [
    {
      section: 'Bếp',
      items: [
        { label: 'Việc cần làm', icon: <FiCoffee />, path: '/kitchen' },
      ],
    },
  ],
  admin: [
    {
      section: 'Quản lý',
      items: [
        { label: 'Tổng quan',   icon: <FiGrid />,       path: '/admin' },
        { label: 'Bàn',         icon: <MdTableRestaurant />, path: '/admin/tables' },
      ],
    },
    {
      section: 'Thực đơn',
      items: [
        { label: 'Món ăn',      icon: <FiShoppingBag />, path: '/admin/products' },
        { label: 'Danh mục',    icon: <FiTag />,          path: '/admin/categories' },
      ],
    },
    {
      section: 'Nhân sự',
      items: [
        { label: 'Người dùng',  icon: <FiUsers />,        path: '/admin/users' },
      ],
    },
  ],
};

/* ─── Role label ─── */
const ROLE_LABEL = {
  staff:   'Nhân viên',
  kitchen: 'Bếp',
  admin:   'Quản trị',
};

/* ─── Lấy initials từ tên ─── */
function getInitials(name = '') {
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(-2)
    .join('')
    .toUpperCase() || 'U';
}

/* ─── Page title theo pathname ─── */
function getPageTitle(pathname) {
  const map = {
    '/staff/orders':      'Đơn hàng',
    '/staff/serving':     'Phục vụ món',
    '/staff/tables':      'Quản lý bàn',
    '/kitchen':           'Màn hình bếp',
    '/admin':             'Tổng quan',
    '/admin/tables':      'Quản lý bàn',
    '/admin/products':    'Quản lý món ăn',
    '/admin/categories':  'Danh mục',
    '/admin/users':       'Người dùng',
  };
  return map[pathname] ?? 'Restaurant OS';
}

export default function DashboardLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const role = user?.role ?? 'staff';
  const displayName = user?.username ?? user?.name ?? 'Nguoi dung';
  const sections = NAV_CONFIG[role] ?? [];

  // Flatten items để dùng cho bottom nav
  const allItems = sections.flatMap((s) => s.items);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  // Redirect nếu chưa login (phòng thủ thêm, ProtectedRoute đã xử lý chính)
  useEffect(() => {
    if (!user) navigate('/login');
  }, [user, navigate]);

  if (!user) return null;

  const pageTitle = getPageTitle(location.pathname);

  return (
    <div className="dashboard-layout">
      {/* ══════════ SIDEBAR (desktop) ══════════ */}
      <aside className="sidebar">
        {/* Brand */}
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">
            <FiCoffee />
          </div>
          <div className="sidebar-brand-text">
            <span className="sidebar-brand-name">Restaurant OS</span>
            <span className="sidebar-brand-role">{ROLE_LABEL[role]}</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          {sections.map((section) => (
            <div key={section.section}>
              <div className="sidebar-nav-section">{section.section}</div>
              {section.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/admin'}
                  className={({ isActive }) =>
                    'sidebar-nav-item' + (isActive ? ' active' : '')
                  }
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-label">{item.label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* Footer: user info + logout */}
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">
              {getInitials(displayName)}
            </div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{displayName}</div>
              <div className="sidebar-user-role">{ROLE_LABEL[role]}</div>
            </div>
          </div>
          <button className="btn-logout" onClick={handleLogout}>
            <FiLogOut size={15} />
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* ══════════ MAIN ══════════ */}
      <div className="dashboard-main">
        {/* Topbar */}
        <header className="topbar">
          <h1 className="topbar-title">{pageTitle}</h1>
          {/* Slot cho action buttons — các page con có thể dùng portal nếu cần */}
        </header>

        {/* Page content — Outlet render page tương ứng */}
        <main className="page-content">
          <Outlet />
        </main>
      </div>

      {/* ══════════ BOTTOM NAV (mobile) ══════════ */}
      <nav className="bottom-nav">
        {allItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/admin'}
            className={({ isActive }) =>
              'bottom-nav-item' + (isActive ? ' active' : '')
            }
          >
            <span className="bottom-nav-icon">{item.icon}</span>
            <span className="bottom-nav-label">{item.label}</span>
          </NavLink>
        ))}

        {/* Logout ở bottom nav mobile */}
        <button className="bottom-nav-item" onClick={handleLogout}>
          <span className="bottom-nav-icon"><FiLogOut /></span>
          <span className="bottom-nav-label">Thoát</span>
        </button>
      </nav>
    </div>
  );
}
