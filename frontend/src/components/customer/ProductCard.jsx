import { useState } from 'react'
import { FiPlus, FiMinus, FiShoppingBag } from 'react-icons/fi'
import useCartStore from '../../store/cartStore'
import './ProductCard.css'

export default function ProductCard({ product }) {
  const { id, name, price, image } = product
  const { items, addItem, removeItem } = useCartStore()
  const [imgError, setImgError] = useState(false)
  const [adding, setAdding] = useState(false)

  const qty = items.filter((item) => item.product_id === id).length

  const handleAdd = () => {
    setAdding(true)
    addItem(product)
    setTimeout(() => setAdding(false), 300)
  }

  const handleRemove = () => {
    removeItem(id)
  }

  const formatPrice = (p) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p)

  return (
    <div className={`product-card ${adding ? 'product-card--adding' : ''}`}>
      {/* Image */}
      <div className="product-card__img-wrap">
        {image && !imgError ? (
          <img
            src={image}
            alt={name}
            className="product-card__img"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="product-card__img-placeholder">
            <FiShoppingBag size={32} />
          </div>
        )}
        {qty > 0 && (
          <span className="product-card__badge">{qty}</span>
        )}
      </div>

      {/* Body */}
      <div className="product-card__body">
        <h3 className="product-card__name">{name}</h3>
        
        <div className="product-card__footer">
          <span className="product-card__price">{formatPrice(price)}</span>

          {qty === 0 ? (
            <button className="product-card__btn-add" onClick={handleAdd}>
              <FiPlus size={18} />
            </button>
          ) : (
            <div className="product-card__qty-ctrl">
              <button className="product-card__btn-qty" onClick={handleRemove}>
                <FiMinus size={14} />
              </button>
              <span className="product-card__qty-num">{qty}</span>
              <button className="product-card__btn-qty product-card__btn-qty--plus" onClick={handleAdd}>
                <FiPlus size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
