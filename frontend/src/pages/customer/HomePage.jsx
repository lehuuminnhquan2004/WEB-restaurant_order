import { useNavigate } from "react-router-dom";
import useCartStore from "../../store/cartStore";
import { FiHome, FiList, FiFileText, FiChevronRight } from 'react-icons/fi';
import useTableStore from "../../store/tableStore";
import { useEffect, useRef, useState } from "react";
import productApi from '../../api/productApi'
import bannerApi from '../../api/bannerApi'
import CustomerSupportChat from '../../components/customer/CustomerSupportChat'
import './HomePage.css'

// Bottom nav dùng chung cho các trang customer
export function CustomerBottomNav({active}){
    const navigate = useNavigate()
    const {items} = useCartStore()
    const totalQty = items.reduce((s, i)=> s+i.quantity,0)

    const tabs=[
        {key: 'home', label: 'Trang chủ', icon:<FiHome size={22} />,     path: '/home' },
        { key: 'menu',    label: 'Menu', icon: <FiList size={22} />,     path: '/menu' },
        { key: 'invoice', label: 'Hoá đơn', icon: <FiFileText size={22} />, path: '/orders' },
    ]
    return (
    <nav className="customer-nav">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          className={`customer-nav__tab ${active === tab.key ? 'customer-nav__tab--active' : ''}`}
          onClick={() => navigate(tab.path)}
        >
          <span className="customer-nav__icon">
            {tab.icon}
            {tab.key === 'menu' && totalQty > 0 && (
              <span className="customer-nav__dot">{totalQty}</span>
            )}
          </span>
          <span className="customer-nav__label">{tab.label}</span>
        </button>
      ))}
    </nav>
  )
}

const DEFAULT_BANNERS = [
  {
    id: 1,
    bg: '#ffe8d6',
    text: 'Khai trương - Giảm 20% tất cả món',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 2,
    bg: '#d6f0e0',
    text: 'Combo trưa đặc biệt chỉ từ 59.000đ',
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 3,
    bg: '#d6e8ff',
    text: 'Món mới tháng này - Thử ngay!',
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80',
  },
]

export default function HomePage(){
    const navigate = useNavigate()
    const { tableId, tableName }= useTableStore()

    const [bestSellers, setBestSellers] = useState([])
    const [banners, setBanners] = useState(DEFAULT_BANNERS)
    const [bannerIdx, setBannerIdx] = useState(0)
    const bannerTimer = useRef(null)

    useEffect(()=>{
        if(!tableId) navigate('/login', {replace: true})
    },[tableId,navigate])

    useEffect(() => {
        bannerApi.getAll()
        .then((res) => {
            const activeBanners = Array.isArray(res.data)
                ? res.data.filter((banner) => banner.text || banner.image)
                : []

            if (activeBanners.length > 0) {
                setBanners(activeBanners)
                setBannerIdx(0)
            }
        })
        .catch(() => {})
    }, [])

      // Auto chạy banner quảng cáo
    useEffect(() => {
        bannerTimer.current = setInterval(() => {
        setBannerIdx((i) => (i + 1) % banners.length)
        }, 3200)
        return () => clearInterval(bannerTimer.current)
    }, [banners.length])

    useEffect(()=>{
        productApi.getAll().then((res)=>{
            const available=res.data.filter((p)=>p.status==='available')
            // Lấy 6 món đầu làm best seller (thay bằng trường sort sau)
            setBestSellers(available.slice(0, 6))
        })
        .catch(()=>{})
    },[])

    const formatPrice = (p) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p)

    return (
        <div className="home-page">
    
        {/* ── Header ── */}
        <header className="home-header">
            <div className="home-header__table-badge">
            Bàn <strong>{tableName || '—'}</strong>
            </div>
            <h1 className="home-header__name">MINH QUÂN RESTAURANT</h1>
            <p className="home-header__sub">Chào mừng bạn đến với chúng tôi 🙌</p>
        </header>
    
        {/* ── Banner lướt ngang ── */}
        <section className="home-banner">
            <div
            className="home-banner__track"
            style={{ transform: `translateX(-${bannerIdx * 100}%)` }}
            >
            {banners.map((b) => (
                <div
                key={b.id}
                className="home-banner__slide"
                style={{ background: b.bg }}
                >
                {b.image && (
                    <img className="home-banner__image" src={b.image} alt={b.text || 'Banner'} />
                )}
                {b.text && <p className="home-banner__text">{b.text}</p>}
                </div>
            ))}
            </div>
    
            {/* Dots */}
            <div className="home-banner__dots">
            {banners.map((_, i) => (
                <button
                key={i}
                className={`home-banner__dot ${i === bannerIdx ? 'home-banner__dot--active' : ''}`}
                onClick={() => setBannerIdx(i)}
                />
            ))}
            </div>
        </section>
    
        {/* ── Món bán chạy ── */}
        <section className="home-section">
            <div className="home-section__head">
            <h2 className="home-section__title">🔥 Món bán chạy</h2>
            <button
                className="home-section__more"
                onClick={() => navigate('/menu')}
            >
                Xem tất cả <FiChevronRight size={14} />
            </button>
            </div>
    
            {bestSellers.length === 0 ? (
            <div className="home-bestseller-empty">
                {[1,2,3,4].map((i) => <div key={i} className="home-bestseller-skeleton" />)}
            </div>
            ) : (
            <div className="home-bestseller-grid">
                {bestSellers.map((p) => (
                <button
                    key={p.id}
                    className="home-bestseller-card"
                    onClick={() => navigate('/menu')}
                >
                    <div className="home-bestseller-card__img-wrap">
                    {p.image ? (
                        <img src={p.image} alt={p.name} className="home-bestseller-card__img" />
                    ) : (
                        <div className="home-bestseller-card__img-placeholder">🍽️</div>
                    )}
                    </div>
                    <p className="home-bestseller-card__name">{p.name}</p>
                    <p className="home-bestseller-card__price">{formatPrice(p.price)}</p>
                </button>
                ))}
            </div>
            )}
        </section>
    
        {/* ── CTA buttons ── */}
        <section className="home-cta">
            <button
            className="home-cta__btn home-cta__btn--primary"
            onClick={() => navigate('/menu')}
            >
            <FiList size={20} />
            Xem Menu
            </button>
            <button
            className="home-cta__btn home-cta__btn--secondary"
            onClick={() => navigate('/orders')}
            >
            <FiFileText size={20} />
            Thanh toán
            </button>
        </section>
    
        {/* ── Bottom Nav ── */}
        <CustomerBottomNav active="home" />
        <CustomerSupportChat />
        </div>
    )
}
