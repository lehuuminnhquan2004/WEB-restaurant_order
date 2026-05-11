import { useCallback, useEffect, useMemo, useState } from 'react'
import orderApi from '../../api/orderApi'
import socket from '../../api/socket'
import '../admin/AdminMenuPage.css'
import './KitchenPage.css'

function getErrorMessage(error) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    'Không thể xử lý yêu cầu.'
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

  useEffect(() => {
    if (!socket.connected) {
      socket.connect()
    }

    function handleOrdersChanged() {
      fetchKitchenOrders()
    }

    socket.on('orders:changed', handleOrdersChanged)

    return () => {
      socket.off('orders:changed', handleOrdersChanged)
    }
  }, [fetchKitchenOrders])


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
      setSuccess(`Đã chuyển đơn #${item.order_id} sang đang nấu.`)
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
      setSuccess(`Đã hoàn thành món "${item.product_name}".`)
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
          <h1 className="kp-title">Màn hình bếp</h1>
          <p className="kp-subtitle">Hiển thị từng món chưa nấu theo thứ tự đơn cũ đến mới.</p>
        </div>

        <button className="btn btn-ghost" onClick={fetchKitchenOrders} disabled={loading}>
          {loading ? 'Đang tải...' : 'Làm mới'}
        </button>
      </div>

      {error && <div className="amp-feedback amp-feedback--error">{error}</div>}
      {success && <div className="amp-feedback amp-feedback--success">{success}</div>}

      <div className="kp-summary">
        <div className="kp-summary__card">
          <span>Đơn trong bếp</span>
          <strong>{orders.length}</strong>
        </div>
        <div className="kp-summary__card">
          <span>Món cần làm</span>
          <strong>{kitchenItems.length}</strong>
        </div>
      </div>

      {loading ? (
        <div className="kp-empty">Đang tải danh sách món...</div>
      ) : kitchenItems.length === 0 ? (
        <div className="kp-empty">Không có món nào đang chờ bếp xử lý.</div>
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
                        Đơn #{item.order_id} • {item.table_name}
                      </div>
                      <h2 className="kp-card__title">{item.product_name}</h2>
                      <p className="kp-card__meta">Nhận lúc {formatTime(item.created_at)}</p>
                    </div>

                    <div className={`kp-status kp-status--${item.order_status}`}>
                      {item.order_status}
                    </div>
                  </div>

                  <div className="kp-card__details">
                    <span>Số lượng: <strong>x{item.quantity}</strong></span>
                    {item.note && <span>Ghi chú: <strong>{item.note}</strong></span>}
                  </div>

                  <div className="kp-card__actions">
                    <button
                      className="btn btn-ghost"
                      onClick={() => handleStartCooking(item)}
                      disabled={!isConfirmed || acting === startKey}
                    >
                      {acting === startKey ? 'Đang cập nhật...' : 'Đang nấu'}
                    </button>

                    <button
                      className="btn btn-primary"
                      onClick={() => handleFinishItem(item)}
                      disabled={isConfirmed || acting === doneKey}
                    >
                      {acting === doneKey ? 'Đang cập nhật...' : 'Hoàn thành món'}
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
