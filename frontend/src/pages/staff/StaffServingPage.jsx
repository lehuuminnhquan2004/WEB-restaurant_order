import { useCallback, useEffect, useMemo, useState } from 'react'
import orderApi from '../../api/orderApi'
import '../admin/AdminMenuPage.css'
import './StaffBase.css'
import './StaffServingPage.css'

function getErrorMessage(error) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    'Khong the xu ly yeu cau.'
  )
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

function flattenServingItems(orders) {
  return orders
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    .flatMap((order) =>
      (order.items || [])
        .filter((item) => item.status === 'done')
        .map((item) => ({
          ...item,
          order_id: order.id,
          order_status: order.status,
          table_name: order.table_name || `Ban ${order.table_id}`,
          created_at: order.created_at,
        }))
    )
}

export default function StaffServingPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [actingKey, setActingKey] = useState('')

  const fetchServingOrders = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const [preparingRes, doneRes] = await Promise.all([
        orderApi.getAll({ status: 'preparing' }),
        orderApi.getAll({ status: 'done' }),
      ])

      setOrders([...preparingRes.data, ...doneRes.data])
    } catch (fetchError) {
      setError(getErrorMessage(fetchError))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchServingOrders()
  }, [fetchServingOrders])

  useEffect(() => {
    if (!success) return

    const timeoutId = setTimeout(() => setSuccess(''), 3000)
    return () => clearTimeout(timeoutId)
  }, [success])

  const servingItems = useMemo(() => flattenServingItems(orders), [orders])

  async function handleMarkServed(item) {
    const key = `${item.order_id}-${item.id}`
    setActingKey(key)
    setError('')

    try {
      await orderApi.updateItemStatus(item.order_id, item.id, 'served')
      setSuccess(`Da phuc vu mon "${item.product_name}" cho ${item.table_name}.`)
      await fetchServingOrders()
    } catch (updateError) {
      setError(getErrorMessage(updateError))
    } finally {
      setActingKey('')
    }
  }

  return (
    <div className="sp-page">
      <div className="sp-header">
        <div>
          <h1 className="sp-title">Phuc vu mon</h1>
          <p className="sp-subtitle">Hien thi cac mon da nau xong va can dua len ban.</p>
        </div>

        <button className="btn btn-ghost" onClick={fetchServingOrders} disabled={loading}>
          {loading ? 'Dang tai...' : 'Lam moi'}
        </button>
      </div>

      {error && <div className="amp-feedback amp-feedback--error">{error}</div>}
      {success && <div className="amp-feedback amp-feedback--success">{success}</div>}

      {loading ? (
        <div className="sp-empty">Dang tai cac mon can phuc vu...</div>
      ) : servingItems.length === 0 ? (
        <div className="sp-empty">Khong co mon nao dang cho phuc vu.</div>
      ) : (
        <div className="ssp-list">
          {servingItems.map((item, index) => {
            const itemKey = `${item.order_id}-${item.id}`

            return (
              <article key={itemKey} className="ssp-card">
                <div className="ssp-card__queue">#{index + 1}</div>

                <div className="ssp-card__main">
                  <div className="ssp-card__top">
                    <div>
                      <div className="ssp-card__eyebrow">
                        {item.table_name} • Don #{item.order_id}
                      </div>
                      <h2 className="ssp-card__title">{item.product_name}</h2>
                      <p className="ssp-card__meta">Xong luc {formatTime(item.created_at)}</p>
                    </div>

                    <div className="ssp-badge">Can phuc vu</div>
                  </div>

                  <div className="ssp-card__details">
                    <span>So luong: <strong>x{item.quantity}</strong></span>
                    {item.note && <span>Ghi chu: <strong>{item.note}</strong></span>}
                  </div>

                  <div className="ssp-card__actions">
                    <button
                      className="btn btn-primary"
                      onClick={() => handleMarkServed(item)}
                      disabled={actingKey === itemKey}
                    >
                      {actingKey === itemKey ? 'Dang cap nhat...' : 'Da phuc vu'}
                    </button>
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
