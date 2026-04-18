import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiShoppingCart, FiAlertCircle, FiLoader } from 'react-icons/fi'
import useCartStore from '../../store/cartStore'
import useTableStore from '../../store/tableStore'
import categoryApi from '../../api/categoryApi'
import productApi from '../../api/productApi'
import ProductCard from '../../components/customer/ProductCard'
import './MenuPage.css'
import {CustomerBottomNav} from './HomePage'

export default function MenuPage() {
  const navigate = useNavigate()
  const { tableId, tableName } = useTableStore()
  const { items } = useCartStore()

  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [activeCatId, setActiveCatId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const tabsRef = useRef(null)
  const sectionRefs = useRef({})

  const totalQty = items.reduce((s, i) => s + i.quantity, 0)
  const totalPrice = items.reduce((s, i) => s + i.price * i.quantity, 0)

  // Redirect nếu không có tableInfo
  useEffect(() => {
    if (!tableId) {
      navigate('/login', { replace: true })
    }
  }, [tableId, navigate])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [catRes, proRes] = await Promise.all([
        categoryApi.getAll(),
        productApi.getAll(),
      ])

      const cats = catRes.data
      const pros = proRes.data
      setCategories(cats)
      setProducts(pros)
      if (cats.length > 0) { setActiveCatId(cats[0].id) }

    } catch {
      setError('Không thể tải menu vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Scroll tab pill vào giữa khi đổi category
  useEffect(() => {
    if (!activeCatId || !tabsRef.current) return
    const activeTab = tabsRef.current.querySelector(`[data-cat="${activeCatId}"]`)
    if (activeTab) {
      activeTab.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest'
      })
    }
  }, [activeCatId])

  const handleTabClick = (catId) => {
    setActiveCatId(catId)
    const section = sectionRefs.current[catId]
    if (section) {
      const offset = 120 //header + tab height
      const top = section.getBoundingClientRect().top + window.scrollY - offset
      window.scrollTo({ top, behavior: 'smooth' })
    }
  }

  const getProductsByCategory = (catId) =>
    products.filter((p) => p.category_id === catId && p.status === 'available')

  const formatPrice = (p) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p)

  // --- Loading ---
  if (loading) {
    return (
      <div className='menu-loading'>
        <div className='menu-loading_spinner'>
          <FiLoader size={32} />
        </div>
        <p>Đang tải thực đơn</p>
      </div>
    )
  }
  // --- Error ---
  if (error) {
    return (
      <div className="menu-error">
        <FiAlertCircle size={40} />
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Thử lại</button>
      </div>
    )
  }

  return (
    <div className="menu-page">
      {/*Header*/}
      <header className="menu-header">
        <div className='menu-header__iner'>
          <div className="menu-header__table">
            <span className='menu-header__label'>Bàn</span>
            <span className='menu-header__table-num'>{tableName ?? '-'}</span>
          </div>
          <h1 className='menu-header__title'>Thực đơn</h1>
          <div className='menu-header__spacer'></div>
        </div>

        {/* Category Tabs */}
        <div className="menu-tabs" ref={tabsRef}>
          {categories.map((cat) => (
            <button
              key={cat.id}
              data-cat={cat.id}
              className={`menu-tabs__pill ${activeCatId === cat.id ? 'menu-tabs__pill--active' : ''}`}
              onClick={() => handleTabClick(cat.id)}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </header>

       {/* Menu sections */}
      <main className="menu-main">
        {categories.map((cat) => {
          const prods = getProductsByCategory(cat.id)
          if (prods.length === 0) return null
          return (
            <section
              key={cat.id}
              ref={(el) => (sectionRefs.current[cat.id] = el)}
              className="menu-section"
            >
              <h2 className="menu-section__title">{cat.name}</h2>
              <div className="menu-grid">
                {prods.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </section>
          )
        })}
      </main>

      {/* Cart FAB */}
      {totalQty > 0 && (
        <div className="menu-cart-bar" onClick={() => navigate('/orders')}>
          <div className="menu-cart-bar__left">
            <div className="menu-cart-bar__icon">
              <FiShoppingCart size={20} />
              <span className="menu-cart-bar__count">{totalQty}</span>
            </div>
            <span className="menu-cart-bar__label">Xem giỏ hàng</span>
          </div>
          <span className="menu-cart-bar__total">{formatPrice(totalPrice)}</span>
        </div>
      )}

      {/* ── Bottom Nav ── */}
      <CustomerBottomNav active="menu" />
      
    </div>
  )
}