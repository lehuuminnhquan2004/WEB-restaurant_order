import OrdersViewerContent from './OrdersViewerContent'
import './OrdersViewerModal.css'

export default function OrdersViewerModal({
  title,
  subtitle,
  tableName,
  orders = [],
  onClose,
  actionLabel = '',
  onAction,
  isActionDisabled,
  onRemoveItem,
  isRemoveDisabled,
  removingItemKey,
  emptyText = 'Chưa có đơn nào.',
}) {
  return (
    <div className="amp-modal-backdrop" onClick={(event) => event.target === event.currentTarget && onClose()}>
      <div className="amp-modal ovm-modal ovm-modal--wide">
        <div className="ovm-modal__header">
          <div>
            <h2 className="amp-modal__title">{title}</h2>
            {subtitle && <p className="ovm-modal__subtitle">{subtitle}</p>}
          </div>
          <button className="btn btn-ghost" onClick={onClose}>Đóng</button>
        </div>

        <OrdersViewerContent
          tableName={tableName}
          orders={orders}
          actionLabel={actionLabel}
          onAction={onAction}
          isActionDisabled={isActionDisabled}
          onRemoveItem={onRemoveItem}
          isRemoveDisabled={isRemoveDisabled}
          removingItemKey={removingItemKey}
          emptyText={emptyText}
        />
      </div>
    </div>
  )
}
