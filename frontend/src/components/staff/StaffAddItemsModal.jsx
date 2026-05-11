import MenuItemGrid from '../menu/MenuItemGrid'

function formatPrice(value) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(value || 0)
}

function summarizeActiveOrders(orders) {
  const orderCount = orders.length
  const total = orders.reduce((sum, order) => sum + Number(order.total_price || 0), 0)
  return { orderCount, total }
}

export default function StaffAddItemsModal({
  table,
  products,
  activeOrders,
  cart,
  busy,
  onAdd,
  onRemove,
  onSubmit,
  onClose,
}) {
  const totalQuantity = Object.values(cart).reduce((sum, quantity) => sum + quantity, 0)
  const totalPrice = products.reduce(
    (sum, product) => sum + (cart[product.id] || 0) * Number(product.price || 0),
    0
  )
  const activeSummary = summarizeActiveOrders(activeOrders)

  return (
    <div className="amp-modal-backdrop" onClick={(event) => event.target === event.currentTarget && onClose()}>
      <div className="amp-modal sp-modal sp-modal--wide">
        <div className="sp-modal__header">
          <div>
            <h2 className="amp-modal__title">Thêm món cho {table.name}</h2>
            <p className="sp-subtitle">Chọn món cần gọi thêm cho bàn này.</p>
          </div>
          <button className="btn btn-ghost" onClick={onClose} disabled={busy}>Đóng</button>
        </div>

        <div className="sp-summary-grid">
          <div className="sp-summary-card">
            <span className="sp-summary-card__label">Đơn đang mở</span>
            <strong>{activeSummary.orderCount}</strong>
          </div>
          <div className="sp-summary-card">
            <span className="sp-summary-card__label">Tam tinh hien tai</span>
            <strong>{formatPrice(activeSummary.total)}</strong>
          </div>
          <div className="sp-summary-card">
            <span className="sp-summary-card__label">Món sắp thêm</span>
            <strong>{totalQuantity}</strong>
          </div>
        </div>

        {activeOrders.length > 0 && (
          <div className="sp-inline-orders">
            {activeOrders.map((order) => (
              <div key={order.id} className="sp-inline-orders__item">
                <span>Đơn #{order.id}</span>
                <span>{order.status}</span>
                <span>{formatPrice(order.total_price)}</span>
              </div>
            ))}
          </div>
        )}

        <MenuItemGrid
          items={products}
          mode="order"
          loading={false}
          cart={cart}
          onAdd={onAdd}
          onRemove={onRemove}
        />

        <div className="sp-modal__footer">
          <div>
            <span className="sp-order-card__total-label">Tổng giá trị thêm</span>
            <strong className="sp-order-card__total-value">{formatPrice(totalPrice)}</strong>
          </div>

          <button
            className="btn btn-primary"
            onClick={onSubmit}
            disabled={busy || totalQuantity === 0}
          >
            {busy ? 'Đang tạo đơn...' : 'Thêm món vào bàn'}
          </button>
        </div>
      </div>
    </div>
  )
}
