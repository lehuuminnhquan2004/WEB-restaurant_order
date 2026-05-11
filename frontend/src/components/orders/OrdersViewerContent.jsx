import './OrdersViewerModal.css'

const ORDER_STATUS_LABEL = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  preparing: 'Đang chế biến',
  done: 'Chờ phục vụ',
  paid: 'Đã thanh toán',
}

const ITEM_STATUS_LABEL = {
  pending: 'Đang chờ',
  done: 'Đã xong',
  served: 'Đã phục vụ',
}

function formatPrice(value) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(value || 0)
}

function formatTime(value) {
  if (!value) return '--'

  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
  }).format(new Date(value))
}

function flattenPendingItems(orders) {
  return [...orders]
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    .flatMap((order) =>
      (order.items || []).map((item) => ({
        ...item,
        order_id: order.id,
        order_status: order.status,
        created_at: order.created_at,
      }))
    )
}

function groupDisplayItems(items) {
  const groups = new Map()

  items.forEach((item) => {
    const key = [
      item.order_id,
      item.product_id,
      item.note || '',
      item.status,
    ].join('|')

    if (!groups.has(key)) {
      groups.set(key, {
        ...item,
        quantity: 0,
        unit_price: Number(item.price || 0),
        line_total: 0,
        rawItems: [],
      })
    }

    const group = groups.get(key)
    group.quantity += 1
    group.line_total += Number(item.price || 0)
    group.rawItems.push(item)
  })

  return Array.from(groups.values())
}

export default function OrdersViewerContent({
  title = '',
  subtitle = '',
  tableName,
  orders = [],
  actionLabel = '',
  onAction,
  isActionDisabled,
  onRemoveItem,
  isRemoveDisabled,
  removingItemKey = '',
  emptyText = 'Chưa có đơn nào.',
}) {
  const totalOrders = orders.length
  const totalAmount = orders.reduce(
    (sum, order) => sum + Number(order.total_price || 0),
    0
  )
  const mergedItems = flattenPendingItems(orders)
  const groupedItems = groupDisplayItems(mergedItems)
  const actionDisabled = typeof isActionDisabled === 'function'
    ? isActionDisabled(orders)
    : !onAction

  return (
    <>
      {(title || subtitle) && (
        <div className="ovm-content__intro">
          {title && <h2 className="ovm-content__title">{title}</h2>}
          {subtitle && <p className="ovm-modal__subtitle">{subtitle}</p>}
        </div>
      )}

      <div className="ovm-summary-grid">
        <div className="ovm-summary-card">
          <span className="ovm-summary-card__label">Tổng đơn đang mở</span>
          <strong>{totalOrders}</strong>
        </div>
        <div className="ovm-summary-card">
          <span className="ovm-summary-card__label">Tổng tạm tính</span>
          <strong>{formatPrice(totalAmount)}</strong>
        </div>
        <div className="ovm-summary-card">
          <span className="ovm-summary-card__label">Tổng món chưa thanh toán</span>
          <strong>{mergedItems.length}</strong>
        </div>
      </div>

      {mergedItems.length === 0 ? (
        <div className="ovm-empty">{emptyText}</div>
      ) : (
        <div className="ovm-order-card">
          <div className="ovm-order-card__head">
            <div>
              <div className="ovm-order-card__eyebrow">Tất cả đơn chưa thanh toán</div>
              <h2 className="ovm-order-card__title">{tableName}</h2>
              <p className="ovm-order-card__meta">
                Hiển thị liên tục theo thứ tự đơn cũ đến mới
              </p>
            </div>
          </div>

          <div className="ovm-order-items">
            {groupedItems.map((item, index) => (
              <div key={`${item.order_id}-${item.product_id}-${index}`} className="ovm-order-item">
                <div>
                  <div className="ovm-order-item__meta">
                    Đơn #{item.order_id} - {formatTime(item.created_at)} - {ORDER_STATUS_LABEL[item.order_status] || item.order_status}
                  </div>
                  <strong>{item.product_name}</strong>
                  {item.note && <p className="ovm-order-item__note">Ghi chú: {item.note}</p>}
                  <p className="ovm-order-item__note">Trạng thái món: {ITEM_STATUS_LABEL[item.status] || item.status}</p>
                </div>
                <div className="ovm-order-item__side">
                  <span>x{item.quantity}</span>
                  <span>{formatPrice(item.line_total)}</span>
                  {onRemoveItem && (
                    <button
                      className="ovm-order-item__remove"
                      onClick={() => onRemoveItem(item.rawItems[0])}
                      disabled={typeof isRemoveDisabled === 'function' ? isRemoveDisabled(item.rawItems[0]) : false}
                    >
                      {removingItemKey === `${item.order_id}-${item.rawItems[0]?.id}` ? 'Đang xoá...' : 'Xoá 1 món'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="ovm-order-card__foot">
            <div>
              <span className="ovm-order-card__total-label">Tổng tiền chưa thanh toán</span>
              <strong className="ovm-order-card__total-value">{formatPrice(totalAmount)}</strong>
            </div>

            {actionLabel && (
              <button
                className="btn btn-primary"
                onClick={() => onAction?.(orders)}
                disabled={actionDisabled}
              >
                {actionLabel}
              </button>
            )}
          </div>
        </div>
      )}
    </>
  )
}
