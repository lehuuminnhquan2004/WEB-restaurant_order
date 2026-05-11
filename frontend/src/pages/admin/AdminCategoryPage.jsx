import { useCallback, useEffect, useMemo, useState } from 'react'
import categoryApi from '../../api/categoryApi'
import './AdminMenuPage.css'
import '../../components/menu/MenuItemGrid.css'
import './AdminTablesPage.css'

function getErrorMessage(error) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    'Không thể xử lý yêu cầu.'
  )
}

function Btn({ children, variant = 'primary', sm, ...props }) {
  const cls = ['btn', `btn-${variant}`, sm ? 'btn-sm' : ''].filter(Boolean).join(' ')
  return <button className={cls} {...props}>{children}</button>
}

function CategoryFormModal({ initial, onSave, onClose, saving }) {
  const [name, setName] = useState(initial?.name ?? '')

  function handleSubmit() {
    const trimmedName = name.trim()
    if (!trimmedName) {
      return
    }

    onSave({ name: trimmedName })
  }

  return (
    <div className="amp-modal-backdrop" onClick={(event) => event.target === event.currentTarget && onClose()}>
      <div className="amp-modal">
        <h2 className="amp-modal__title">
          {initial?.id ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới'}
        </h2>

        <div className="amp-form">
          <label className="amp-label">
            Tên danh mục *
            <input
              className="amp-input"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="VD: Món chính"
              autoFocus
              disabled={saving}
            />
          </label>
        </div>

        <div className="amp-modal__actions" style={{ marginTop: '1rem' }}>
          <Btn onClick={handleSubmit} disabled={saving || !name.trim()}>
            {saving ? 'Đang lưu...' : 'Lưu'}
          </Btn>
          <Btn variant="ghost" onClick={onClose} disabled={saving}>Huỷ</Btn>
        </div>
      </div>
    </div>
  )
}

function ConfirmDeleteModal({ item, onConfirm, onClose, busy }) {
  return (
    <div className="amp-modal-backdrop" onClick={(event) => event.target === event.currentTarget && onClose()}>
      <div className="amp-modal">
        <div className="amp-confirm">
          <p>Xác nhận xoá danh mục <strong>"{item.name}"</strong>?</p>
          <p style={{ fontSize: '0.82rem', color: '#b45309' }}>
            Hành động này không thể hoàn tác.
          </p>
          <div className="amp-confirm__actions">
            <Btn variant="danger" onClick={onConfirm} disabled={busy}>
              {busy ? 'Đang xoá...' : 'Xoá'}
            </Btn>
            <Btn variant="ghost" onClick={onClose} disabled={busy}>Huỷ</Btn>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AdminCategoryPage() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null)
  const [saving, setSaving] = useState(false)

  const fetchCategories = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const response = await categoryApi.getAll()
      setCategories(response.data)
    } catch (error) {
      setError(getErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  useEffect(() => {
    if (!success) return

    const timeoutId = setTimeout(() => setSuccess(''), 3000)
    return () => clearTimeout(timeoutId)
  }, [success])

  const filteredCategories = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    if (!keyword) {
      return categories
    }

    return categories.filter((category) => category.name.toLowerCase().includes(keyword))
  }, [categories, search])

  async function withSave(label, action) {
    setSaving(true)
    setError('')

    try {
      await action()
      setSuccess(label)
      setModal(null)
      await fetchCategories()
    } catch (error) {
      setError(getErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  function handleSaveForm(formData) {
    const item = modal?.item

    if (item?.id) {
      withSave(`Đã cập nhật "${formData.name}".`, () => categoryApi.update(item.id, formData))
      return
    }

    withSave(`Đã thêm "${formData.name}".`, () => categoryApi.create(formData))
  }

  function handleDeleteConfirm() {
    const item = modal?.item
    withSave(`Đã xoá "${item.name}".`, () => categoryApi.delete(item.id))
  }

  return (
    <div className="amp-page">
      <div className="amp-header">
        <h1 className="amp-title">Quản lý danh mục</h1>
        <div className="amp-toolbar">
          <Btn variant="ghost" onClick={fetchCategories} disabled={loading}>Làm mới</Btn>
          <Btn onClick={() => setModal({ type: 'form', item: null })}>+ Thêm danh mục</Btn>
        </div>
      </div>

      <div className="mig__bar" style={{ marginBottom: '1rem' }}>
        <input
          className="mig__search"
          placeholder="Tim danh muc..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      {error && <div className="amp-feedback amp-feedback--error">{error}</div>}
      {success && <div className="amp-feedback amp-feedback--success">{success}</div>}

      {loading ? (
        <div className="mig__empty">
          <div className="mig__empty-icon">...</div>
          <p>Đang tải danh sách danh mục...</p>
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="mig__empty">
          <div className="mig__empty-icon">#</div>
          <p>Không tìm thấy danh mục nào.</p>
        </div>
      ) : (
        <div className="atp-grid">
          {filteredCategories.map((category) => (
            <div key={category.id} className="table-card">
              <div className="table-card__header">
                <h3 className="table-card__name">{category.name}</h3>
                <span className="table-card__badge table-card__badge--available">
                  ID {category.id}
                </span>
              </div>

              <div className="table-card__actions">
                <button
                  className="table-card__btn table-card__btn--ghost"
                  onClick={() => setModal({ type: 'form', item: category })}
                >
                  Sửa
                </button>
                <button
                  className="table-card__btn table-card__btn--danger"
                  onClick={() => setModal({ type: 'delete', item: category })}
                >
                  Xoá
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal?.type === 'form' && (
        <CategoryFormModal
          initial={modal.item}
          onSave={handleSaveForm}
          onClose={() => setModal(null)}
          saving={saving}
        />
      )}

      {modal?.type === 'delete' && (
        <ConfirmDeleteModal
          item={modal.item}
          onConfirm={handleDeleteConfirm}
          onClose={() => setModal(null)}
          busy={saving}
        />
      )}
    </div>
  )
}
