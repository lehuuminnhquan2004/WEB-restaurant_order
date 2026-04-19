import { useCallback, useEffect, useMemo, useState } from 'react'
import orderApi from '../../api/orderApi'
import '../admin/AdminMenuPage.css'
import './KitchenPage.css'

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

function flattenKitchenItems(orders) {
  return orders
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    .flatMap((order) =>
      (order.items || [])
        .filter((item) => item.status === 'pending')
        .map((item) => ({
          ...item,
          order_id: order.id,
          order_status: order.status,
          table_name: order.table_name || `Ban ${order.table_id}`,
          created_at: order.created_at,
        }))
    )
}

export default function KitchenPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [acting, setActing] = useState('')

  const fetchKitchenOrders = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const [confirmedRes, preparingRes] = await Promise.all([
        orderApi.getAll({ status: 'confirmed' }),
        orderApi.getAll({ status: 'preparing' }),
      ])

      setOrders([...confirmedRes.data, ...preparingRes.data])
    } catch (fetchError) {
      setError(getErrorMessage(fetchError))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchKitchenOrders();
  }, [fetchKitchenOrders])

  // useEffect(() => {
  //   const intervalId = setInterval(fetchKitchenOrders, 3000)
  //   return () => clearInterval(intervalId)
  // }, [fetchKitchenOrders])


  useEffect(() => {
    if (!success) return

    const timeoutId = setTimeout(() => setSuccess(''), 3000)
    return () => clearTimeout(timeoutId)
  }, [success])

  const kitchenItems = useMemo(() => flattenKitchenItems(orders), [orders])

  async function handleStartCooking(item) {
    const key = `start-${item.order_id}`
    setActing(key)
    setError('')

    try {
      await orderApi.updateStatus(item.order_id, 'preparing')
      setSuccess(`Da chuyen don #${item.order_id} sang dang nau.`)
      await fetchKitchenOrders()
    } catch (updateError) {
      setError(getErrorMessage(updateError))
    } finally {
      setActing('')
    }
  }

  async function handleFinishItem(item) {
    const key = `done-${item.id}`
    setActing(key)
    setError('')

    try {
      await orderApi.updateItemStatus(item.order_id, item.id, 'done')
      setSuccess(`Da hoan thanh mon "${item.product_name}".`)
      await fetchKitchenOrders()
    } catch (updateError) {
      setError(getErrorMessage(updateError))
    } finally {
      setActing('')
    }
  }

  return (
    <div className="kp-page">
      <div className="kp-header">
        <div>
          <h1 className="kp-title">Man hinh bep</h1>
          <p className="kp-subtitle">Hien thi tung mon chua nau theo thu tu don cu den moi.</p>
        </div>

        <button className="btn btn-ghost" onClick={fetchKitchenOrders} disabled={loading}>
          {loading ? 'Dang tai...' : 'Lam moi'}
        </button>
      </div>

      {error && <div className="amp-feedback amp-feedback--error">{error}</div>}
      {success && <div className="amp-feedback amp-feedback--success">{success}</div>}

      <div className="kp-summary">
        <div className="kp-summary__card">
          <span>Don trong bep</span>
          <strong>{orders.length}</strong>
        </div>
        <div className="kp-summary__card">
          <span>Mon can lam</span>
          <strong>{kitchenItems.length}</strong>
        </div>
      </div>

      {loading ? (
        <div className="kp-empty">Dang tai danh sach mon...</div>
      ) : kitchenItems.length === 0 ? (
        <div className="kp-empty">Khong co mon nao dang cho bep xu ly.</div>
      ) : (
        <div className="kp-list">
          {kitchenItems.map((item, index) => {
            const isConfirmed = item.order_status === 'confirmed'
            const startKey = `start-${item.order_id}`
            const doneKey = `done-${item.id}`

            return (
              <article key={`${item.order_id}-${item.id}`} className="kp-card">
                <div className="kp-card__queue">#{index + 1}</div>

                <div className="kp-card__main">
                  <div className="kp-card__top">
                    <div>
                      <div className="kp-card__eyebrow">
                        Don #{item.order_id} • {item.table_name}
                      </div>
                      <h2 className="kp-card__title">{item.product_name}</h2>
                      <p className="kp-card__meta">Nhan luc {formatTime(item.created_at)}</p>
                    </div>

                    <div className={`kp-status kp-status--${item.order_status}`}>
                      {item.order_status}
                    </div>
                  </div>

                  <div className="kp-card__details">
                    <span>So luong: <strong>x{item.quantity}</strong></span>
                    {item.note && <span>Ghi chu: <strong>{item.note}</strong></span>}
                  </div>

                  <div className="kp-card__actions">
                    <button
                      className="btn btn-ghost"
                      onClick={() => handleStartCooking(item)}
                      disabled={!isConfirmed || acting === startKey}
                    >
                      {acting === startKey ? 'Dang cap nhat...' : 'Dang nau'}
                    </button>

                    <button
                      className="btn btn-primary"
                      onClick={() => handleFinishItem(item)}
                      disabled={isConfirmed || acting === doneKey}
                    >
                      {acting === doneKey ? 'Dang cap nhat...' : 'Hoan thanh mon'}
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
