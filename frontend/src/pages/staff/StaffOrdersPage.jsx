import { useCallback, useEffect, useState } from 'react'
import orderApi from '../../api/orderApi'
import '../admin/AdminMenuPage.css'
import '../admin/AdminTablesPage.css'
import './StaffBase.css'
import './StaffOrdersPage.css'

const NEXT_STATUS = {
  pending: { status: 'confirmed', label: 'Xac nhan don' },
}

function getErrorMessage(error) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    'Khong the xu ly yeu cau.'
  )
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

export default function StaffOrdersPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [actingId, setActingId] = useState(null)

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const response = await orderApi.getAll({ status: 'pending' })
      setOrders(response.data)
    } catch (fetchError) {
      setError(getErrorMessage(fetchError))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  useEffect(() => {
    if (!success) return

    const timeoutId = setTimeout(() => setSuccess(''), 3000)
    return () => clearTimeout(timeoutId)
  }, [success])

  async function handleChangeStatus(order, nextStatus) {
    setActingId(order.id)
    setError('')

    try {
      await orderApi.updateStatus(order.id, nextStatus)
      setSuccess(`Da cap nhat don #${order.id} sang "${nextStatus}".`)
      await fetchOrders()
    } catch (updateError) {
      setError(getErrorMessage(updateError))
    } finally {
      setActingId(null)
    }
  }

  return (
    <div className="sp-page">
      <div className="sp-header">
        <div>
          <h1 className="sp-title">Xac nhan don hang</h1>
          <p className="sp-subtitle">Chi hien thi cac don cho xac nhan de chuyen sang bep.</p>
        </div>

        <button className="btn btn-ghost" onClick={fetchOrders} disabled={loading}>
          {loading ? 'Dang tai...' : 'Lam moi'}
        </button>
      </div>

      {error && <div className="amp-feedback amp-feedback--error">{error}</div>}
      {success && <div className="amp-feedback amp-feedback--success">{success}</div>}

      {loading ? (
        <div className="sp-empty">Dang tai danh sach don...</div>
      ) : orders.length === 0 ? (
        <div className="sp-empty">Khong co don pending nao can staff xac nhan.</div>
      ) : (
        <div className="sp-order-list">
          {orders.map((order) => {
            const nextAction = NEXT_STATUS[order.status]

            return (
              <article key={order.id} className="sp-order-card">
                <div className="sp-order-card__head">
                  <div>
                    <div className="sp-order-card__eyebrow">Don #{order.id}</div>
                    <h2 className="sp-order-card__title">{order.table_name || `Ban ${order.table_id}`}</h2>
                    <p className="sp-order-card__meta">{formatTime(order.created_at)}</p>
                  </div>

                  <span className={`sp-status sp-status--${order.status}`}>
                    {order.status}
                  </span>
                </div>

                <div className="sp-order-items">
                  {order.items?.map((item) => (
                    <div key={item.id} className="sp-order-item">
                      <div>
                        <strong>{item.product_name}</strong>
                        {item.note && <p className="sp-order-item__note">Ghi chu: {item.note}</p>}
                      </div>
                      <div className="sp-order-item__side">
                        <span>x{item.quantity}</span>
                        <span>{formatPrice(item.price * item.quantity)}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="sp-order-card__foot">
                  <div>
                    <span className="sp-order-card__total-label">Tong tien</span>
                    <strong className="sp-order-card__total-value">{formatPrice(order.total_price)}</strong>
                  </div>

                  <div className="sp-order-card__actions">
                    {nextAction ? (
                      <button
                        className="btn btn-primary"
                        onClick={() => handleChangeStatus(order, nextAction.status)}
                        disabled={actingId === order.id}
                      >
                        {actingId === order.id ? 'Dang cap nhat...' : nextAction.label}
                      </button>
                    ) : (
                      <button className="btn btn-ghost" disabled>
                        Khong co thao tac tiep
                      </button>
                    )}
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
