// src/pages/PlaceholderPage.jsx
// Dùng tạm cho các page chưa làm — xóa sau khi có page thật

export function MenuPage() {
  return <Placeholder title="Menu" desc="Trang xem menu cho khách" color="#2563eb" />;
}

export function OrderPage() {
  return <Placeholder title="Đơn hàng của tôi" desc="Khách xem lại món đã đặt" color="#2563eb" />;
}

export function StaffOrderPage() {
  return <Placeholder title="Đơn hàng" desc="Nhân viên xác nhận & xử lý đơn" color="#16a34a" />;
}

export function StaffTablePage() {
  return <Placeholder title="Quản lý bàn" desc="Xem trạng thái các bàn" color="#16a34a" />;
}

export function KitchenPage() {
  return <Placeholder title="Màn hình bếp" desc="Danh sách món cần nấu" color="#d97706" />;
}

export function AdminDashboardPage() {
  return <Placeholder title="Tổng quan" desc="Dashboard admin" color="#7c3aed" />;
}

export function AdminProductPage() {
  return <Placeholder title="Quản lý món ăn" desc="Thêm / sửa / xóa món" color="#7c3aed" />;
}

export function AdminCategoryPage() {
  return <Placeholder title="Danh mục" desc="Quản lý danh mục món ăn" color="#7c3aed" />;
}

export function AdminTablePage() {
  return <Placeholder title="Quản lý bàn" desc="Thêm / xóa / tạo QR bàn" color="#7c3aed" />;
}

export function AdminUserPage() {
  return <Placeholder title="Người dùng" desc="Quản lý tài khoản nhân viên" color="#7c3aed" />;
}

/* ── Component dùng chung ── */
function Placeholder({ title, desc, color }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      gap: 16,
      textAlign: 'center',
    }}>
      <div style={{
        width: 64,
        height: 64,
        borderRadius: 16,
        background: color + '1a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 28,
      }}>
        🚧
      </div>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a' }}>{title}</h2>
      <p style={{ fontSize: 14, color: '#64748b', maxWidth: 280 }}>
        {desc} — <strong>đang xây dựng</strong>
      </p>
      <div style={{
        padding: '4px 14px',
        borderRadius: 999,
        background: color + '1a',
        color: color,
        fontSize: 12,
        fontWeight: 600,
      }}>
        Coming soon
      </div>
    </div>
  );
}