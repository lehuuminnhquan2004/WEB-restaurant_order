import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiX, FiShoppingCart, FiTrash2, FiMinus, FiPlus } from 'react-icons/fi'
import useCartStore from '../../store/cartStore'
import './CartDrawer.css'

/**
 * CartDrawer — slide-up bottom sheet
 * Props:
 *   open: boolean
 *   onClose: () => void
 */
export default function CartDrawer({ open, onClose }) {
  const navigate = useNavigate()
  const { items, addItem, removeItem, deleteItem, totalItems, totalPrice } = useCartStore()
  const overlayRef = useRef(null)

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose()
  }

  const handleCheckout = () => {
    onClose()
    navigate('/orders')
  }

  const formatPrice = (p) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p)

  return (
    <>
      <div
        ref={overlayRef}
        onClick={handleOverlayClick}
        className={`cart-overlay ${open ? 'cart-overlay--visible' : ''}`}
      />

      <div className={`cart-sheet ${open ? 'cart-sheet--open' : ''}`}>

        <div className="cart-sheet__handle-wrap">
          <div className="cart-sheet__handle" />
        </div>

        <div className="cart-sheet__header">
          <div className="cart-sheet__header-left">
            <FiShoppingCart size={20} color="var(--color-primary, #e07a3a)" />
            <h2 className="cart-sheet__title">Giỏ hàng</h2>
            {totalItems() > 0 && (
              <span className="cart-sheet__badge">{totalItems()}</span>
            )}
          </div>
          <button className="cart-sheet__close-btn" onClick={onClose}>
            <FiX size={16} />
          </button>
        </div>

        <div className="cart-sheet__body">
          {items.length === 0 ? (
            <div className="cart-sheet__empty">
              <FiShoppingCart size={44} strokeWidth={1.2} />
              <p>Chưa có món nào</p>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.product_id} className="cart-item">
                <div className="cart-item__info">
                  <p className="cart-item__name">{item.name}</p>
                  <p className="cart-item__price">{formatPrice(item.price)}</p>
                </div>

                <div className="cart-item__qty-ctrl">
                  <button
                    className="cart-item__qty-btn"
                    onClick={() => removeItem(item.product_id)}
                  >
                    <FiMinus size={12} />
                  </button>
                  <span className="cart-item__qty-num">{item.quantity}</span>
                  <button
                    className="cart-item__qty-btn cart-item__qty-btn--plus"
                    onClick={() => addItem({ id: item.product_id, name: item.name, price: item.price })}
                  >
                    <FiPlus size={12} />
                  </button>
                </div>

                <button
                  className="cart-item__delete-btn"
                  onClick={() => deleteItem(item.product_id)}
                >
                  <FiTrash2 size={15} />
                </button>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="cart-sheet__footer">
            <div className="cart-sheet__total-row">
              <span className="cart-sheet__total-label">Tổng cộng</span>
              <span className="cart-sheet__total-price">{formatPrice(totalPrice())}</span>
            </div>
            <button className="cart-sheet__checkout-btn" onClick={handleCheckout}>
              Xem &amp; Đặt món →
            </button>
          </div>
        )}
      </div>
    </>
  )
}