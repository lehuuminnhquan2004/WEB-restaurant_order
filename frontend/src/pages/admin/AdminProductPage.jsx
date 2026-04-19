import { useCallback, useEffect, useMemo, useState } from 'react'
import productApi from '../../api/productApi'
import categoryApi from '../../api/categoryApi'
import MenuItemGrid from '../../components/menu/MenuItemGrid'
import './AdminMenuPage.css'

const EMPTY_FORM = {
  name: '',
  price: '',
  image: '',
  category_id: '',
  status: 'available',
}

function getErrorMessage(error) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    'Khong the xu ly yeu cau.'
  )
}

function Btn({ children, variant = 'primary', sm, ...props }) {
  const cls = ['btn', `btn-${variant}`, sm ? 'btn-sm' : ''].filter(Boolean).join(' ')
  return <button className={cls} {...props}>{children}</button>
}

function ProductFormModal({ initial, categories, onSave, onClose, saving }) {
  const [form, setForm] = useState(
    initial || {
      ...EMPTY_FORM,
      category_id: categories[0]?.id ?? '',
    }
  )

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function handleSubmit() {
    const name = form.name.trim()
    const price = Number(form.price)
    const categoryId = Number(form.category_id)

    if (!name || !price || price <= 0 || !categoryId) {
      return
    }

    onSave({
      name,
      price,
      image: form.image.trim() || null,
      category_id: categoryId,
      status: form.status,
    })
  }

  return (
    <div className="amp-modal-backdrop" onClick={(event) => event.target === event.currentTarget && onClose()}>
      <div className="amp-modal">
        <h2 className="amp-modal__title">
          {initial?.id ? 'Chinh sua mon' : 'Them mon moi'}
        </h2>

        <div className="amp-form">
          <label className="amp-label">
            Ten mon *
            <input
              className="amp-input"
              value={form.name}
              onChange={(event) => setField('name', event.target.value)}
              placeholder="VD: Pho bo tai"
              autoFocus
              disabled={saving}
            />
          </label>

          <label className="amp-label">
            Gia (VND) *
            <input
              className="amp-input"
              type="number"
              min="0"
              step="1000"
              value={form.price}
              onChange={(event) => setField('price', event.target.value)}
              placeholder="VD: 85000"
              disabled={saving}
            />
          </label>

          <label className="amp-label">
            Anh mon
            <input
              className="amp-input"
              value={form.image}
              onChange={(event) => setField('image', event.target.value)}
              placeholder="https://example.com/pho-bo.jpg"
              disabled={saving}
            />
          </label>

          <label className="amp-label">
            Danh muc
            <select
              className="amp-select"
              value={form.category_id}
              onChange={(event) => setField('category_id', event.target.value)}
              disabled={saving}
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>

          <div className="amp-toggle-row">
            <span className="amp-toggle-label">Con phuc vu</span>
            <label className="amp-toggle">
              <input
                type="checkbox"
                checked={form.status === 'available'}
                onChange={(event) => setField('status', event.target.checked ? 'available' : 'unavailable')}
                disabled={saving}
              />
              <span className="amp-toggle-slider" />
            </label>
          </div>
        </div>

        <div className="amp-modal__actions" style={{ marginTop: '1rem' }}>
          <Btn
            onClick={handleSubmit}
            disabled={saving || !form.name.trim() || !form.price || !form.category_id}
          >
            {saving ? 'Dang luu...' : 'Luu'}
          </Btn>
          <Btn variant="ghost" onClick={onClose} disabled={saving}>Huy</Btn>
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
          <p>Xac nhan xoa mon <strong>"{item.name}"</strong>?</p>
          <p style={{ fontSize: '0.82rem', color: '#b45309' }}>
            Hanh dong nay khong the hoan tac.
          </p>
          <div className="amp-confirm__actions">
            <Btn variant="danger" onClick={onConfirm} disabled={busy}>
              {busy ? 'Dang xoa...' : 'Xoa'}
            </Btn>
            <Btn variant="ghost" onClick={onClose} disabled={busy}>Huy</Btn>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AdminProductPage() {
  const [items, setItems] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [modal, setModal] = useState(null)
  const [saving, setSaving] = useState(false)

  const fetchItems = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const [productsRes, categoriesRes] = await Promise.all([
        productApi.getAll(),
        categoryApi.getAll(),
      ])

      setItems(productsRes.data)
      setCategories(categoriesRes.data)
    } catch (error) {
      setError(getErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  useEffect(() => {
    if (!success) return

    const timeoutId = setTimeout(() => setSuccess(''), 3000)
    return () => clearTimeout(timeoutId)
  }, [success])

  const normalizedInitialItem = useMemo(() => {
    if (!modal?.item) {
      return null
    }

    return {
      id: modal.item.id,
      name: modal.item.name ?? '',
      price: modal.item.price ?? '',
      image: modal.item.image ?? '',
      category_id: modal.item.category_id ?? categories[0]?.id ?? '',
      status: modal.item.status ?? 'available',
    }
  }, [modal, categories])

  async function withSave(label, action) {
    setSaving(true)
    setError('')

    try {
      await action()
      setSuccess(label)
      setModal(null)
      await fetchItems()
    } catch (error) {
      setError(getErrorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  function handleSaveForm(formData) {
    const item = modal?.item

    if (item?.id) {
      withSave(`Da cap nhat "${formData.name}".`, () => productApi.update(item.id, formData))
      return
    }

    withSave(`Da them "${formData.name}".`, () => productApi.create(formData))
  }

  function handleDeleteConfirm() {
    const item = modal?.item
    withSave(`Da xoa "${item.name}".`, () => productApi.delete(item.id))
  }

  function handleToggle(item) {
    withSave(
      `Da ${item.status === 'available' ? 'an' : 'hien'} "${item.name}".`,
      () => productApi.update(item.id, {
        name: item.name,
        price: item.price,
        image: item.image ?? null,
        description: item.description ?? null,
        category_id: item.category_id,
        status: item.status === 'available' ? 'unavailable' : 'available',
      })
    )
  }

  return (
    <div className="amp-page">
      <div className="amp-header">
        <h1 className="amp-title">Quan ly mon an</h1>
        <div className="amp-toolbar">
          <Btn variant="ghost" onClick={fetchItems} disabled={loading}>Lam moi</Btn>
          <Btn
            onClick={() => setModal({
              type: 'form',
              item: {
                ...EMPTY_FORM,
                category_id: categories[0]?.id ?? '',
              },
            })}
            disabled={!categories.length}
          >
            + Them mon
          </Btn>
        </div>
      </div>

      {error && <div className="amp-feedback amp-feedback--error">{error}</div>}
      {success && <div className="amp-feedback amp-feedback--success">{success}</div>}

      <MenuItemGrid
        items={items}
        mode="admin"
        loading={loading}
        onEdit={(item) => setModal({ type: 'form', item })}
        onDelete={(item) => setModal({ type: 'delete', item })}
        onToggle={handleToggle}
      />

      {modal?.type === 'form' && (
        <ProductFormModal
          initial={normalizedInitialItem}
          categories={categories}
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
