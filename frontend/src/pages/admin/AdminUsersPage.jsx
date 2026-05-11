import { useCallback, useEffect, useMemo, useState } from 'react'
import userApi from '../../api/userApi'
import './AdminMenuPage.css'
import '../../components/menu/MenuItemGrid.css'
import '../../components/tables/TableCard.css'
import './AdminTablesPage.css'
import './AdminUsersPage.css'

const ROLES = [
  { value: 'all', label: 'Tất cả role' },
  { value: 'admin', label: 'Admin' },
  { value: 'staff', label: 'Staff' },
  { value: 'kitchen', label: 'Kitchen' },
]

const EMPTY_FORM = {
  username: '',
  password: '',
  role: 'staff',
}

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

function UserFormModal({ initial, onSave, onClose, saving }) {
  const [form, setForm] = useState(initial || EMPTY_FORM)

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function handleSubmit() {
    const username = form.username.trim()
    if (!username || (!initial?.id && !form.password.trim())) {
      return
    }

    onSave({
      username,
      password: form.password,
      role: form.role,
    })
  }

  return (
    <div className="amp-modal-backdrop" onClick={(event) => event.target === event.currentTarget && onClose()}>
      <div className="amp-modal">
        <h2 className="amp-modal__title">
          {initial?.id ? 'Chỉnh sửa tài khoản' : 'Thêm tài khoản mới'}
        </h2>

        <div className="amp-form">
          <label className="amp-label">
            Username *
            <input
              className="amp-input"
              value={form.username}
              onChange={(event) => setField('username', event.target.value)}
              placeholder="VD: staff2"
              autoFocus
              disabled={saving}
            />
          </label>

          <label className="amp-label">
            {initial?.id ? 'Mật khẩu mới (bỏ trống nếu không đổi)' : 'Mật khẩu *'}
            <input
              className="amp-input"
              type="password"
              value={form.password}
              onChange={(event) => setField('password', event.target.value)}
              placeholder={initial?.id ? 'Nhập nếu muốn đổi mật khẩu' : 'Nhập mật khẩu'}
              disabled={saving}
            />
          </label>

          <label className="amp-label">
            Role
            <select
              className="amp-select"
              value={form.role}
              onChange={(event) => setField('role', event.target.value)}
              disabled={saving}
            >
              {ROLES.filter((role) => role.value !== 'all').map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="amp-modal__actions" style={{ marginTop: '1rem' }}>
          <Btn
            onClick={handleSubmit}
            disabled={saving || !form.username.trim() || (!initial?.id && !form.password.trim())}
          >
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
          <p>Xác nhận xoá tài khoản <strong>"{item.username}"</strong>?</p>
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

function roleBadgeClass(role) {
  if (role === 'admin') return 'table-card__badge table-card__badge--occupied'
  if (role === 'kitchen') return 'table-card__badge aup-badge--kitchen'
  return 'table-card__badge table-card__badge--available'
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [modal, setModal] = useState(null)
  const [saving, setSaving] = useState(false)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const params = {}
      if (roleFilter !== 'all') params.role = roleFilter
      if (search.trim()) params.search = search.trim()

      const response = await userApi.getAll(params)
      setUsers(response.data)
    } catch (fetchError) {
      setError(getErrorMessage(fetchError))
    } finally {
      setLoading(false)
    }
  }, [roleFilter, search])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  useEffect(() => {
    if (!success) return

    const timeoutId = setTimeout(() => setSuccess(''), 3000)
    return () => clearTimeout(timeoutId)
  }, [success])

  const stats = useMemo(() => ({
    total: users.length,
    admin: users.filter((user) => user.role === 'admin').length,
    staff: users.filter((user) => user.role === 'staff').length,
    kitchen: users.filter((user) => user.role === 'kitchen').length,
  }), [users])

  async function withSave(label, action) {
    setSaving(true)
    setError('')

    try {
      await action()
      setSuccess(label)
      setModal(null)
      await fetchUsers()
    } catch (saveError) {
      setError(getErrorMessage(saveError))
    } finally {
      setSaving(false)
    }
  }

  function handleSaveForm(formData) {
    const item = modal?.item

    if (item?.id) {
      withSave(`Đã cập nhật tài khoản "${formData.username}".`, () =>
        userApi.update(item.id, formData)
      )
      return
    }

    withSave(`Đã thêm tài khoản "${formData.username}".`, () =>
      userApi.create(formData)
    )
  }

  function handleDeleteConfirm() {
    const item = modal?.item
    withSave(`Đã xoá tài khoản "${item.username}".`, () => userApi.delete(item.id))
  }

  return (
    <div className="amp-page">
      <div className="amp-header">
        <h1 className="amp-title">Quản lý người dùng</h1>
        <div className="amp-toolbar">
          <Btn variant="ghost" onClick={fetchUsers} disabled={loading}>Làm mới</Btn>
          <Btn onClick={() => setModal({ type: 'form', item: { ...EMPTY_FORM } })}>
            + Thêm tài khoản
          </Btn>
        </div>
      </div>

      <div className="ovm-summary-grid" style={{ marginBottom: '1rem' }}>
        <div className="ovm-summary-card">
          <span className="ovm-summary-card__label">Tổng tài khoản</span>
          <strong>{stats.total}</strong>
        </div>
        <div className="ovm-summary-card">
          <span className="ovm-summary-card__label">Admin</span>
          <strong>{stats.admin}</strong>
        </div>
        <div className="ovm-summary-card">
          <span className="ovm-summary-card__label">Staff</span>
          <strong>{stats.staff}</strong>
        </div>
        <div className="ovm-summary-card">
          <span className="ovm-summary-card__label">Kitchen</span>
          <strong>{stats.kitchen}</strong>
        </div>
      </div>

      <div className="mig__bar" style={{ marginBottom: '1rem', gap: '0.75rem', flexWrap: 'wrap' }}>
        <input
          className="mig__search"
          placeholder="Tim username..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        <select
          className="amp-select"
          value={roleFilter}
          onChange={(event) => setRoleFilter(event.target.value)}
          style={{ maxWidth: '220px' }}
        >
          {ROLES.map((role) => (
            <option key={role.value} value={role.value}>
              {role.label}
            </option>
          ))}
        </select>
      </div>

      {error && <div className="amp-feedback amp-feedback--error">{error}</div>}
      {success && <div className="amp-feedback amp-feedback--success">{success}</div>}

      {loading ? (
        <div className="mig__empty">
          <div className="mig__empty-icon">...</div>
          <p>Đang tải danh sách tài khoản...</p>
        </div>
      ) : users.length === 0 ? (
        <div className="mig__empty">
          <div className="mig__empty-icon">U</div>
          <p>Không tìm thấy tài khoản nào.</p>
        </div>
      ) : (
        <div className="atp-grid">
          {users.map((user) => (
            <div key={user.id} className="table-card">
              <div className="table-card__header">
                <div>
                  <h3 className="table-card__name">{user.username}</h3>
                  <p className="aup-meta">User ID: {user.id}</p>
                </div>
                <span className={roleBadgeClass(user.role)}>
                  {user.role}
                </span>
              </div>

              <div className="table-card__actions">
                <button
                  className="table-card__btn table-card__btn--ghost"
                  onClick={() =>
                    setModal({
                      type: 'form',
                      item: {
                        id: user.id,
                        username: user.username,
                        password: '',
                        role: user.role,
                      },
                    })
                  }
                >
                  Sửa
                </button>
                <button
                  className="table-card__btn table-card__btn--danger"
                  onClick={() => setModal({ type: 'delete', item: user })}
                >
                  Xoá
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal?.type === 'form' && (
        <UserFormModal
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
