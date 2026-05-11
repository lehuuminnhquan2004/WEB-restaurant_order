import { useCallback, useEffect, useState } from 'react'
import bannerApi from '../../api/bannerApi'
import uploadApi from '../../api/uploadApi'
import './BannerManagerPage.css'

const EMPTY_BANNER = {
  text: '',
  bg: '#ffe8d6',
  image: '',
}

const COLOR_PRESETS = ['#ffe8d6', '#d6f0e0', '#d6e8ff', '#fff3bf', '#fde2e4', '#e7f5ff']

function getErrorMessage(error) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    'Không thể xử lý yêu cầu.'
  )
}

function createBanner() {
  return {
    ...EMPTY_BANNER,
    id: Date.now(),
  }
}

export default function BannerManagerPage() {
  const [banners, setBanners] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingId, setUploadingId] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const fetchBanners = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const response = await bannerApi.getAll()
      const nextBanners = Array.isArray(response.data) ? response.data : []
      setBanners(nextBanners.length ? nextBanners : [createBanner()])
    } catch (fetchError) {
      setError(getErrorMessage(fetchError))
      setBanners([createBanner()])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBanners()
  }, [fetchBanners])

  useEffect(() => {
    if (!success) return

    const timeoutId = setTimeout(() => setSuccess(''), 3000)
    return () => clearTimeout(timeoutId)
  }, [success])

  function updateBanner(id, field, value) {
    setBanners((current) =>
      current.map((banner) =>
        banner.id === id ? { ...banner, [field]: value } : banner
      )
    )
  }

  function addBanner() {
    setBanners((current) => [...current, createBanner()])
  }

  function removeBanner(id) {
    setBanners((current) =>
      current.length === 1 ? current : current.filter((banner) => banner.id !== id)
    )
  }

  async function handleUploadImage(id, file) {
    if (!file) return

    setUploadingId(id)
    setError('')

    try {
      const response = await uploadApi.uploadImage(file)
      updateBanner(id, 'image', response.data.url)
    } catch (uploadError) {
      setError(getErrorMessage(uploadError))
    } finally {
      setUploadingId(null)
    }
  }

  async function handleSave() {
    const cleaned = banners
      .map((banner) => ({
        id: banner.id,
        text: banner.text.trim(),
        bg: banner.bg,
        image: banner.image?.trim() || '',
      }))
      .filter((banner) => banner.text || banner.image)

    if (cleaned.length === 0) {
      setError('Cần ít nhất 1 banner có nội dung hoặc hình ảnh.')
      return
    }

    setSaving(true)
    setError('')

    try {
      const response = await bannerApi.updateAll(cleaned)
      setBanners(response.data.banners)
      setSuccess('Đã cập nhật banner trang khách hàng.')
    } catch (saveError) {
      setError(getErrorMessage(saveError))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bmp-page">
      <div className="bmp-header">
        <div>
          <h1 className="bmp-title">Quản lý banner</h1>
          <p className="bmp-subtitle">Thêm URL hình ảnh để banner chạy ở trang chủ khách hàng.</p>
        </div>

        <div className="bmp-actions">
          <button className="btn btn-ghost" onClick={fetchBanners} disabled={loading || saving || uploadingId}>
            {loading ? 'Đang tải...' : 'Làm mới'}
          </button>
          <button className="btn btn-primary" onClick={handleSave} disabled={loading || saving || uploadingId}>
            {saving ? 'Đang lưu...' : 'Lưu banner'}
          </button>
        </div>
      </div>

      {error && <div className="bmp-feedback bmp-feedback--error">{error}</div>}
      {success && <div className="bmp-feedback bmp-feedback--success">{success}</div>}

      {loading ? (
        <div className="bmp-empty">Đang tải danh sách banner...</div>
      ) : (
        <div className="bmp-grid">
          <section className="bmp-editor">
            {banners.map((banner, index) => (
              <article key={banner.id} className="bmp-card">
                <div className="bmp-card__head">
                  <strong>Banner {index + 1}</strong>
                  <button
                    className="bmp-card__remove"
                    onClick={() => removeBanner(banner.id)}
                    disabled={banners.length === 1 || saving || uploadingId === banner.id}
                  >
                    Xoá
                  </button>
                </div>

                <label className="bmp-label">
                  Tải ảnh từ máy
                  <input
                    className="bmp-input"
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    onChange={(event) => handleUploadImage(banner.id, event.target.files?.[0])}
                    disabled={saving || uploadingId === banner.id}
                  />
                  {uploadingId === banner.id && (
                    <span className="bmp-help">Đang tải ảnh lên...</span>
                  )}
                </label>

                <label className="bmp-label">
                  URL hình ảnh
                  <input
                    className="bmp-input"
                    value={banner.image || ''}
                    onChange={(event) => updateBanner(banner.id, 'image', event.target.value)}
                    placeholder="https://example.com/banner.jpg"
                    disabled={saving || uploadingId === banner.id}
                  />
                </label>

                <label className="bmp-label">
                  Nội dung phủ lên ảnh
                  <input
                    className="bmp-input"
                    value={banner.text}
                    maxLength={120}
                    onChange={(event) => updateBanner(banner.id, 'text', event.target.value)}
                    placeholder="VD: Combo trưa đặc biệt chỉ từ 59.000đ"
                    disabled={saving || uploadingId === banner.id}
                  />
                </label>

                <label className="bmp-label">
                  Màu nền
                  <div className="bmp-color-row">
                    <input
                      className="bmp-color-input"
                      type="color"
                      value={banner.bg}
                      onChange={(event) => updateBanner(banner.id, 'bg', event.target.value)}
                      disabled={saving || uploadingId === banner.id}
                    />
                    <input
                      className="bmp-input bmp-input--color"
                      value={banner.bg}
                      onChange={(event) => updateBanner(banner.id, 'bg', event.target.value)}
                      disabled={saving || uploadingId === banner.id}
                    />
                  </div>
                </label>

                <div className="bmp-swatches">
                  {COLOR_PRESETS.map((color) => (
                    <button
                      key={color}
                      className="bmp-swatch"
                      style={{ background: color }}
                      onClick={() => updateBanner(banner.id, 'bg', color)}
                      disabled={saving || uploadingId === banner.id}
                      title={color}
                    />
                  ))}
                </div>
              </article>
            ))}

            <button
              className="bmp-add"
              onClick={addBanner}
              disabled={saving || uploadingId || banners.length >= 8}
            >
              + Thêm banner
            </button>
          </section>

          <aside className="bmp-preview">
            <h2>Xem trước</h2>
            <div className="bmp-preview__stack">
              {banners.filter((banner) => banner.text.trim() || banner.image?.trim()).map((banner) => (
                <div
                  key={banner.id}
                  className="bmp-preview__banner"
                  style={{ background: banner.bg }}
                >
                  {banner.image && (
                    <img src={banner.image} alt={banner.text || 'Banner'} />
                  )}
                  {banner.text && <span>{banner.text}</span>}
                </div>
              ))}
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}
