import { useCallback, useEffect, useState } from 'react'
import TableCard from '../../components/tables/TableCard'
import tableApi from '../../api/tableApi'
import './AdminTablesPage.css'

function getErrorMessage(error) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    'Không thể xử lý yêu cầu.'
  )
}

export default function AdminTablesPage() {
  const [tables, setTables] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')

  const fetchTables = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const res = await tableApi.getAll()
      setTables(res.data)
    } catch (fetchError) {
      setError(getErrorMessage(fetchError))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTables()
  }, [fetchTables])

  useEffect(() => {
    if (!success) return

    const timeoutId = setTimeout(() => setSuccess(''), 3000)
    return () => clearTimeout(timeoutId)
  }, [success])

  async function handleCreate() {
    const trimmedName = newName.trim()

    if (!trimmedName) return

    setCreating(true)
    setError('')

    try {
      await tableApi.create({ name: trimmedName })
      setNewName('')
      setSuccess(`Đã tạo bàn "${trimmedName}" thành công.`)
      await fetchTables()
    } catch (createError) {
      setError(getErrorMessage(createError))
    } finally {
      setCreating(false)
    }
  }

  async function handleRefresh(message) {
    if (message) {
      setSuccess(message)
    }

    await fetchTables()
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter') {
      handleCreate()
    }
  }

  return (
    <div className="atp-page">
      <div className="atp-header">
        <h1 className="atp-title">Quản lý bàn</h1>
        <button className="btn btn-ghost" onClick={fetchTables} disabled={loading}>
          {loading ? <span className="spinner" /> : 'Làm mới'}
        </button>
      </div>

      <div className="atp-create-bar">
        <input
          className="atp-input"
          placeholder="Tên bàn mới..."
          value={newName}
          onChange={(event) => setNewName(event.target.value)}
          onKeyDown={handleKeyDown}
          disabled={creating}
        />

        <button
          className="btn btn-primary"
          onClick={handleCreate}
          disabled={creating || !newName.trim()}
        >
          {creating ? <span className="spinner" /> : '+'} Thêm bàn
        </button>
      </div>

      {error && <div className="atp-feedback atp-feedback--error">{error}</div>}
      {success && <div className="atp-feedback atp-feedback--success">{success}</div>}

      {loading ? (
        <div className="atp-loading">
          <span className="spinner" /> Đang tải danh sách bàn...
        </div>
      ) : tables.length === 0 ? (
        <div className="atp-empty">
          <div className="atp-empty-icon">Ban</div>
          <strong>Chưa có bàn nào</strong>
          <p>Nhập tên và nhấn "Thêm bàn" để bắt đầu.</p>
        </div>
      ) : (
        <div className="atp-grid">
          {tables.map((table) => (
            <TableCard
              key={table.id}
              table={table}
              onRefresh={handleRefresh}
            />
          ))}
        </div>
      )}
    </div>
  )
}
