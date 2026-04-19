import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FiArrowLeft, FiTrash2, FiMinus, FiPlus,
  FiCheckCircle, FiAlertCircle, FiEdit3, FiShoppingBag
} from 'react-icons/fi'
import OrdersViewerContent from '../../components/orders/OrdersViewerContent'
import useCartStore from '../../store/cartStore'
import useTableStore from '../../store/tableStore'
import orderApi from '../../api/orderApi'
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

  const formatPrice = (p) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p)

  const toggleNote = (cartItemId) =>
    setNoteOpen((prev) => ({ ...prev, [cartItemId]: !prev[cartItemId] }))

  const totalQty = items.length

  useEffect(() => {
    if (!tableId) {
      navigate('/login', { replace: true })
    }
  }, [tableId, navigate])

  useEffect(() => {
    if (!tableId || items.length > 0) return

    let active = true

    async function fetchPendingOrders() {
      setOrdersLoading(true)

      try {
        const response = await orderApi.getByTable(tableId)
        if (!active) return

        setPendingOrders(
          (response.data || []).filter((order) => order.status !== 'paid')
        )
      } catch {
        if (!active) return
        setPendingOrders([])
      } finally {
        if (active) {
          setOrdersLoading(false)
        }
      }
    }

    fetchPendingOrders()

    return () => {
      active = false
    }
  }, [tableId, items.length])

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
      setErrorMsg(err?.response?.data?.message || 'Dat mon that bai. Vui long thu lai.')
      setScreen(SCREEN.ERROR)
    }
  }

  if (screen === SCREEN.SUCCESS) {
    return (
      <div className="order-feedback">
        <div className="order-feedback__icon order-feedback__icon--success">
          <FiCheckCircle size={40} strokeWidth={1.8} />
        </div>
        <h2 className="order-feedback__title">Dat mon thanh cong!</h2>
        <p className="order-feedback__sub">
          Don hang cua ban <strong>{tableName}</strong> da duoc gui den bep.
        </p>
        <p className="order-feedback__hint">Nhan vien se xac nhan ngay cho ban.</p>
        <button className="order-feedback__btn order-feedback__btn--dark" onClick={() => navigate('/menu')}>
          Tiep tuc goi mon
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
        <h2 className="order-feedback__title">Co loi xay ra</h2>
        <p className="order-feedback__sub">{errorMsg}</p>
        <div className="order-feedback__actions">
          <button className="order-feedback__btn order-feedback__btn--outline" onClick={() => setScreen(SCREEN.REVIEW)}>
            Quay lai
          </button>
          <button className="order-feedback__btn order-feedback__btn--primary" onClick={handlePlaceOrder}>
            Thu lai
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
            {items.length > 0 ? 'Xac nhan don' : 'Hoa don cua ban'}
          </h1>
          <p className="order-header__sub">
            Ban <span className="order-header__table">{tableName || '-'}</span>
          </p>
        </div>
        {items.length > 0 && (
          <button className="order-header__clear-btn" onClick={() => { clearCart(); navigate('/menu') }}>
            <FiTrash2 size={13} /> Xoa het
          </button>
        )}
      </header>

      {items.length === 0 && (
        ordersLoading ? (
          <div className="order-empty">
            <FiShoppingBag size={56} strokeWidth={1.2} />
            <p>Dang tai danh sach don cua ban...</p>
          </div>
        ) : (
          <main className="order-orders-view">
            <OrdersViewerContent
              title="Don chua thanh toan"
              subtitle="Kiem tra cac mon da goi truoc khi thanh toan."
              tableName={tableName || 'Ban cua ban'}
              orders={pendingOrders}
              actionLabel="Thanh toan"
              isActionDisabled={() => true}
              emptyText="Ban nay chua co don nao chua thanh toan."
            />
          </main>
        )
      )}

      {items.length > 0 && (
        <>
          <main className="order-main">
            <p className="order-main__meta">
              {items.length} mon · {totalQty} phan
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
                      <span className="order-item__per"> / phan</span>
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
                      : <span>Them ghi chu...</span>
                    }
                  </button>

                  {noteOpen[item.cart_item_id] && (
                    <input
                      className="order-item__note-input"
                      type="text"
                      maxLength={100}
                      placeholder="VD: khong hanh, it cay..."
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
                <p className="order-bar__label">Tong thanh toan</p>
                <p className="order-bar__total">{formatPrice(totalPrice())}</p>
              </div>
              <p className="order-bar__qty">{totalQty} phan</p>
            </div>

            <button
              className={`order-bar__submit-btn ${screen === SCREEN.LOADING ? 'order-bar__submit-btn--loading' : ''}`}
              onClick={handlePlaceOrder}
              disabled={screen === SCREEN.LOADING}
            >
              {screen === SCREEN.LOADING ? (
                <span className="order-bar__spinner" />
              ) : (
                'Dat mon ngay'
              )}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
