import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FiAlertCircle,
  FiArrowLeft,
  FiCheckCircle,
  FiCreditCard,
  FiDollarSign,
  FiEdit3,
  FiMinus,
  FiPlus,
  FiShoppingBag,
  FiTrash2,
  FiX,
} from 'react-icons/fi'
import OrdersViewerContent from '../../components/orders/OrdersViewerContent'
import useCartStore from '../../store/cartStore'
import useTableStore from '../../store/tableStore'
import orderApi from '../../api/orderApi'
import paymentApi from '../../api/paymentApi'
import socket from '../../api/socket'
import './OrderPage.css'

const SCREEN = { REVIEW: 'review', LOADING: 'loading', SUCCESS: 'success', ERROR: 'error' }

export default function OrderPage() {
  const navigate = useNavigate()
  const { tableId, tableName } = useTableStore()
  const { items, addItem, removeItem, updateNote, clearCart, totalPrice } = useCartStore()

  const [screen, setScreen] = useState(SCREEN.REVIEW)
  const [noteOpen, setNoteOpen] = useState({})
  const [errorMsg, setErrorMsg] = useState('')
  const [pendingOrders, setPendingOrders] = useState([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [transferOpen, setTransferOpen] = useState(false)
  const [transferSettings, setTransferSettings] = useState(null)
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [paymentMessage, setPaymentMessage] = useState('')
  const [paymentNoticeOpen, setPaymentNoticeOpen] = useState(false)
  const [paymentError, setPaymentError] = useState('')

  const formatPrice = (p) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p || 0)

  const fetchPendingOrders = useCallback(async () => {
    if (!tableId || items.length > 0) return

    setOrdersLoading(true)

    try {
      const response = await orderApi.getByTable(tableId)
      setPendingOrders(
        (response.data || []).filter((order) => order.status !== 'paid')
      )
    } catch {
      setPendingOrders([])
    } finally {
      setOrdersLoading(false)
    }
  }, [tableId, items.length])

  const payableOrders = useMemo(
    () => pendingOrders.filter((order) => order.status !== 'paid'),
    [pendingOrders]
  )

  const canPay = useMemo(
    () =>
      payableOrders.length > 0 &&
      payableOrders.every((order) =>
        (order.items || []).length > 0 &&
        order.items.every((item) => item.status === 'served')
      ),
    [payableOrders]
  )

  const paymentTotal = useMemo(
    () => payableOrders.reduce((sum, order) => sum + Number(order.total_price || 0), 0),
    [payableOrders]
  )

  const paymentOrderIds = useMemo(
    () => payableOrders.map((order) => order.id),
    [payableOrders]
  )

  const totalQty = items.length

  const toggleNote = (cartItemId) =>
    setNoteOpen((prev) => ({ ...prev, [cartItemId]: !prev[cartItemId] }))

  useEffect(() => {
    if (!tableId) {
      navigate('/login', { replace: true })
    }
  }, [tableId, navigate])

  useEffect(() => {
    fetchPendingOrders()
  }, [fetchPendingOrders])

  useEffect(() => {
    if (!tableId || items.length > 0) return undefined

    if (!socket.connected) {
      socket.connect()
    }

    function handleOrdersChanged(payload) {
      if (!payload?.tableId || Number(payload.tableId) === Number(tableId)) {
        fetchPendingOrders()
      }
    }

    socket.on('orders:changed', handleOrdersChanged)

    return () => {
      socket.off('orders:changed', handleOrdersChanged)
    }
  }, [tableId, items.length, fetchPendingOrders])

  const handlePlaceOrder = async () => {
    if (items.length === 0) return

    setScreen(SCREEN.LOADING)
    try {
      await orderApi.create({
        table_id: tableId,
        items: items.map((i) => ({
          product_id: i.product_id,
          quantity: 1,
          note: i.note || '',
        })),
      })
      clearCart()
      setScreen(SCREEN.SUCCESS)
    } catch (err) {
      setErrorMsg(err?.response?.data?.message || 'Đặt món thất bại. Vui lòng thử lại.')
      setScreen(SCREEN.ERROR)
    }
  }

  async function createPaymentRequest(method) {
    if (!canPay) return

    setPaymentLoading(true)
    setPaymentError('')
    setPaymentMessage('')
    setPaymentNoticeOpen(false)
    setPaymentNoticeOpen(false)

    try {
      await paymentApi.createRequest({
        table_id: tableId,
        table_name: tableName,
        method,
        total_amount: paymentTotal,
        order_ids: paymentOrderIds,
      })

      setPaymentMessage(
        method === 'cash'
          ? 'Đã gọi nhân viên, vui lòng chờ.'
          : 'Đã báo nhân viên kiểm tra giao dịch chuyển khoản.'
      )
      setPaymentOpen(false)
      setTransferOpen(false)
      setPaymentNoticeOpen(true)
    } catch (err) {
      setPaymentError(err?.response?.data?.message || 'Không thể gửi yêu cầu thanh toán.')
    } finally {
      setPaymentLoading(false)
    }
  }

  async function openTransferPayment() {
    if (!canPay) return

    setPaymentLoading(true)
    setPaymentError('')
    setPaymentMessage('')

    try {
      const response = await paymentApi.getTransferSettings()
      setTransferSettings(response.data || {})
      setPaymentOpen(false)
      setTransferOpen(true)
    } catch (err) {
      setPaymentError(err?.response?.data?.message || 'Không thể tải QR chuyển khoản.')
    } finally {
      setPaymentLoading(false)
    }
  }

  if (screen === SCREEN.SUCCESS) {
    return (
      <div className="order-feedback">
        <div className="order-feedback__icon order-feedback__icon--success">
          <FiCheckCircle size={40} strokeWidth={1.8} />
        </div>
        <h2 className="order-feedback__title">Đặt món thành công!</h2>
        <p className="order-feedback__sub">
          Đơn hàng của bàn <strong>{tableName}</strong> đã được gửi đến bếp.
        </p>
        <p className="order-feedback__hint">Nhân viên sẽ xác nhận ngay cho bạn.</p>
        <button className="order-feedback__btn order-feedback__btn--dark" onClick={() => navigate('/menu')}>
          Tiếp tục gọi món
        </button>
      </div>
    )
  }

  if (screen === SCREEN.ERROR) {
    return (
      <div className="order-feedback">
        <div className="order-feedback__icon order-feedback__icon--error">
          <FiAlertCircle size={40} strokeWidth={1.8} />
        </div>
        <h2 className="order-feedback__title">Có lỗi xảy ra</h2>
        <p className="order-feedback__sub">{errorMsg}</p>
        <div className="order-feedback__actions">
          <button className="order-feedback__btn order-feedback__btn--outline" onClick={() => setScreen(SCREEN.REVIEW)}>
            Quay lại
          </button>
          <button className="order-feedback__btn order-feedback__btn--primary" onClick={handlePlaceOrder}>
            Thử lại
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="order-page">
      <header className="order-header">
        <button
          className="order-header__back-btn"
          onClick={() => navigate(items.length > 0 ? '/menu' : '/home')}
        >
          <FiArrowLeft size={18} />
        </button>
        <div className="order-header__text">
          <h1 className="order-header__title">
            {items.length > 0 ? 'Xác nhận đơn' : 'Hoá đơn của bàn'}
          </h1>
          <p className="order-header__sub">
            Bàn <span className="order-header__table">{tableName || '-'}</span>
          </p>
        </div>
        {items.length > 0 && (
          <button className="order-header__clear-btn" onClick={() => { clearCart(); navigate('/menu') }}>
            <FiTrash2 size={13} /> Xoá hết
          </button>
        )}
      </header>

      {items.length === 0 && (
        ordersLoading ? (
          <div className="order-empty">
            <FiShoppingBag size={56} strokeWidth={1.2} />
            <p>Đang tải danh sách đơn của bàn...</p>
          </div>
        ) : (
          <main className="order-orders-view">
            {paymentError && (
              <div className="order-payment-alert order-payment-alert--error">{paymentError}</div>
            )}
            {!canPay && payableOrders.length > 0 && (
              <div className="order-payment-alert">
                Nút thanh toán sẽ mở khi tất cả món đã được phục vụ.
              </div>
            )}
            <OrdersViewerContent
              title="Đơn chưa thanh toán"
              subtitle="Kiểm tra các món đã gọi trước khi thanh toán."
              tableName={tableName || 'Bàn của bạn'}
              orders={pendingOrders}
              actionLabel="Thanh toán"
              onAction={() => setPaymentOpen(true)}
              isActionDisabled={() => !canPay}
              emptyText="Bàn này chưa có đơn nào chưa thanh toán."
            />
          </main>
        )
      )}

      {items.length > 0 && (
        <>
          <main className="order-main">
            <p className="order-main__meta">
              {items.length} món - {totalQty} phần
            </p>

            {items.map((item, idx) => (
              <div
                key={item.cart_item_id}
                className="order-item"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div className="order-item__row">
                  <div className="order-item__info">
                    <p className="order-item__name">{item.name}</p>
                    <p className="order-item__unit-price">
                      {formatPrice(item.price)}
                      <span className="order-item__per"> / phần</span>
                    </p>
                  </div>

                  <div className="order-item__qty-ctrl">
                    <button
                      className="order-item__qty-btn"
                      onClick={() => removeItem(item.product_id)}
                    >
                      <FiMinus size={13} />
                    </button>
                    <span className="order-item__qty-num">1</span>
                    <button
                      className="order-item__qty-btn order-item__qty-btn--plus"
                      onClick={() => addItem({ id: item.product_id, name: item.name, price: item.price })}
                    >
                      <FiPlus size={13} />
                    </button>
                  </div>

                  <p className="order-item__subtotal">
                    {formatPrice(item.price)}
                  </p>
                </div>

                <div className="order-item__note-wrap">
                  <button
                    className="order-item__note-toggle"
                    onClick={() => toggleNote(item.cart_item_id)}
                  >
                    <FiEdit3 size={12} />
                    {item.note
                      ? <span className="order-item__note-value">{item.note}</span>
                      : <span>Thêm ghi chú...</span>
                    }
                  </button>

                  {noteOpen[item.cart_item_id] && (
                    <input
                      className="order-item__note-input"
                      type="text"
                      maxLength={100}
                      placeholder="VD: không hành, ít cay..."
                      defaultValue={item.note || ''}
                      autoFocus
                      onBlur={(e) => {
                        updateNote(item.cart_item_id, e.target.value)
                        toggleNote(item.cart_item_id)
                      }}
                    />
                  )}
                </div>
              </div>
            ))}
          </main>

          <div className="order-bar">
            <div className="order-bar__summary">
              <div>
                <p className="order-bar__label">Tổng thanh toán</p>
                <p className="order-bar__total">{formatPrice(totalPrice())}</p>
              </div>
              <p className="order-bar__qty">{totalQty} phần</p>
            </div>

            <button
              className={`order-bar__submit-btn ${screen === SCREEN.LOADING ? 'order-bar__submit-btn--loading' : ''}`}
              onClick={handlePlaceOrder}
              disabled={screen === SCREEN.LOADING}
            >
              {screen === SCREEN.LOADING ? (
                <span className="order-bar__spinner" />
              ) : (
                'Đặt món ngay'
              )}
            </button>
          </div>
        </>
      )}

      {paymentOpen && (
        <div className="order-modal-backdrop" role="dialog" aria-modal="true">
          <div className="order-payment-modal">
            <button className="order-payment-modal__close" onClick={() => setPaymentOpen(false)}>
              <FiX size={18} />
            </button>
            <h2>Chọn phương thức thanh toán</h2>
            <p>Tổng cần thanh toán: <strong>{formatPrice(paymentTotal)}</strong></p>

            <div className="order-payment-options">
              <button onClick={() => createPaymentRequest('cash')} disabled={paymentLoading}>
                <FiDollarSign size={20} />
                <span>
                  <strong>Tiền mặt</strong>
                  <small>Báo nhân viên đến bàn thu tiền</small>
                </span>
              </button>
              <button onClick={openTransferPayment} disabled={paymentLoading}>
                <FiCreditCard size={20} />
                <span>
                  <strong>Chuyển khoản</strong>
                  <small>Mở mã QR của nhà hàng</small>
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {paymentNoticeOpen && (
        <div className="order-modal-backdrop" role="dialog" aria-modal="true">
          <div className="order-payment-modal order-payment-modal--notice">
            <div className="order-payment-notice__icon">
              <FiCheckCircle size={34} />
            </div>
            <h2>Đã gửi yêu cầu thanh toán</h2>
            <p>{paymentMessage || 'Đã gọi nhân viên, vui lòng chờ.'}</p>
            <button
              className="order-payment-confirm"
              onClick={() => setPaymentNoticeOpen(false)}
            >
              Tôi đã hiểu
            </button>
          </div>
        </div>
      )}

      {transferOpen && (
        <div className="order-modal-backdrop" role="dialog" aria-modal="true">
          <div className="order-payment-modal order-payment-modal--qr">
            <button className="order-payment-modal__close" onClick={() => setTransferOpen(false)}>
              <FiX size={18} />
            </button>
            <h2>Thanh toán chuyển khoản</h2>
            <p>Tổng cần thanh toán: <strong>{formatPrice(paymentTotal)}</strong></p>

            {transferSettings?.transfer_qr_image ? (
              <img
                className="order-payment-qr"
                src={transferSettings.transfer_qr_image}
                alt="QR chuyển khoản"
              />
            ) : (
              <div className="order-payment-qr order-payment-qr--empty">
                Nhà hàng chưa tải QR chuyển khoản.
              </div>
            )}

            {transferSettings?.transfer_note && (
              <p className="order-payment-note">{transferSettings.transfer_note}</p>
            )}

            <button
              className="order-payment-confirm"
              onClick={() => createPaymentRequest('transfer')}
              disabled={paymentLoading || !transferSettings?.transfer_qr_image}
            >
              Tôi đã chuyển khoản, báo nhân viên
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
