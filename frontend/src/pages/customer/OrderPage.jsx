import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FiArrowLeft, FiTrash2, FiMinus, FiPlus,
  FiCheckCircle, FiAlertCircle, FiEdit3, FiShoppingBag
} from 'react-icons/fi'
import useCartStore from '../../store/cartStore'
import useTableStore from '../../store/tableStore'
import orderApi from '../../api/orderApi'
import './OrderPage.css'

const SCREEN = { REVIEW: 'review', LOADING: 'loading', SUCCESS: 'success', ERROR: 'error' }

export default function OrderPage() {
  const navigate = useNavigate()
  const { tableId, tableName } = useTableStore()
  const { items, addItem, removeItem, deleteItem, updateNote, clearCart, totalPrice } = useCartStore()

  const [screen, setScreen] = useState(SCREEN.REVIEW)
  const [noteOpen, setNoteOpen] = useState({})
  const [errorMsg, setErrorMsg] = useState('')

  const formatPrice = (p) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p)

  const toggleNote = (productId) =>
    setNoteOpen((prev) => ({ ...prev, [productId]: !prev[productId] }))

  const totalQty = items.reduce((s, i) => s + i.quantity, 0)

  const handlePlaceOrder = async () => {
    if (items.length === 0) return
    setScreen(SCREEN.LOADING)
    try {
      await orderApi.create({
        table_id: tableId,
        items: items.map((i) => ({
          product_id: i.product_id,
          quantity: i.quantity,
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

  // ─── Success ───────────────────────────────────────────────────────────────
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

  // ─── Error ─────────────────────────────────────────────────────────────────
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

  // ─── Review ────────────────────────────────────────────────────────────────
  return (
    <div className="order-page">

      {/* Header */}
      <header className="order-header">
        <button className="order-header__back-btn" onClick={() => navigate('/menu')}>
          <FiArrowLeft size={18} />
        </button>
        <div className="order-header__text">
          <h1 className="order-header__title">Xác nhận đơn</h1>
          <p className="order-header__sub">
            Bàn <span className="order-header__table">{tableName || '—'}</span>
          </p>
        </div>
        {items.length > 0 && (
          <button className="order-header__clear-btn" onClick={() => { clearCart(); navigate('/menu') }}>
            <FiTrash2 size={13} /> Xoá hết
          </button>
        )}
      </header>

      {/* Empty state */}
      {items.length === 0 && (
        <div className="order-empty">
          <FiShoppingBag size={56} strokeWidth={1.2} />
          <p>Giỏ hàng trống.<br />Quay lại menu để chọn món nhé!</p>
          <button className="order-empty__btn" onClick={() => navigate('/menu')}>
            Về menu
          </button>
        </div>
      )}

      {/* Items list */}
      {items.length > 0 && (
        <>
          <main className="order-main">
            <p className="order-main__meta">
              {items.length} món · {totalQty} phần
            </p>

            {items.map((item, idx) => (
              <div
                key={item.product_id}
                className="order-item"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                {/* Top row */}
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
                    <span className="order-item__qty-num">{item.quantity}</span>
                    <button
                      className="order-item__qty-btn order-item__qty-btn--plus"
                      onClick={() => addItem({ id: item.product_id, name: item.name, price: item.price })}
                    >
                      <FiPlus size={13} />
                    </button>
                  </div>

                  <p className="order-item__subtotal">
                    {formatPrice(item.price * item.quantity)}
                  </p>
                </div>

                {/* Note row */}
                <div className="order-item__note-wrap">
                  <button
                    className="order-item__note-toggle"
                    onClick={() => toggleNote(item.product_id)}
                  >
                    <FiEdit3 size={12} />
                    {item.note
                      ? <span className="order-item__note-value">{item.note}</span>
                      : <span>Thêm ghi chú…</span>
                    }
                  </button>

                  {noteOpen[item.product_id] && (
                    <input
                      className="order-item__note-input"
                      type="text"
                      maxLength={100}
                      placeholder="VD: không hành, ít cay…"
                      defaultValue={item.note || ''}
                      autoFocus
                      onBlur={(e) => {
                        updateNote(item.product_id, e.target.value)
                        toggleNote(item.product_id)
                      }}
                    />
                  )}
                </div>
              </div>
            ))}
          </main>

          {/* Bottom bar */}
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
                '🍽️  Đặt món ngay'
              )}
            </button>
          </div>
        </>
      )}
    </div>
  )
}