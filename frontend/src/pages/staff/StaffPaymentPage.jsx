import { useCallback, useEffect, useState } from 'react'
import {
  FiCheckCircle,
  FiClock,
  FiCreditCard,
  FiDollarSign,
  FiRefreshCw,
  FiUpload,
} from 'react-icons/fi'
import paymentApi from '../../api/paymentApi'
import uploadApi from '../../api/uploadApi'
import socket from '../../api/socket'
import './StaffBase.css'
import './StaffPaymentPage.css'

function formatPrice(value) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(value || 0)
}

function formatTime(value) {
  if (!value) return '--'
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
  }).format(new Date(value))
}

function getErrorMessage(error) {
  return error?.response?.data?.message || error?.message || 'Không thể xử lý yêu cầu.'
}

export default function StaffPaymentPage() {
  const [requests, setRequests] = useState([])
  const [settings, setSettings] = useState({ transfer_qr_image: '', transfer_note: '' })
  const [loading, setLoading] = useState(true)
  const [savingSettings, setSavingSettings] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [completingId, setCompletingId] = useState(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const fetchRequests = useCallback(async () => {
    setError('')

    try {
      const response = await paymentApi.getPendingRequests()
      setRequests(response.data || [])
    } catch (fetchError) {
      setError(getErrorMessage(fetchError))
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchSettings = useCallback(async () => {
    try {
      const response = await paymentApi.getTransferSettings()
      setSettings(response.data || { transfer_qr_image: '', transfer_note: '' })
    } catch (fetchError) {
      setError(getErrorMessage(fetchError))
    }
  }, [])

  useEffect(() => {
    fetchRequests()
    fetchSettings()
  }, [fetchRequests, fetchSettings])

  useEffect(() => {
    if (!socket.connected) {
      socket.connect()
    }

    function handlePaymentsChanged() {
      fetchRequests()
    }

    socket.on('payments:changed', handlePaymentsChanged)

    return () => {
      socket.off('payments:changed', handlePaymentsChanged)
    }
  }, [fetchRequests])

  async function handleComplete(request) {
    setCompletingId(request.id)
    setError('')
    setMessage('')

    try {
      await paymentApi.completeRequest(request.id)
      setMessage(`Đã xác nhận thanh toán cho ${request.table_name}.`)
      await fetchRequests()
    } catch (completeError) {
      setError(getErrorMessage(completeError))
    } finally {
      setCompletingId(null)
    }
  }

  async function handleUploadQr(event) {
    const file = event.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError('')
    setMessage('')

    try {
      const response = await uploadApi.uploadImage(file)
      setSettings((current) => ({
        ...current,
        transfer_qr_image: response.data.url,
      }))
      setMessage('Đã tải ảnh QR lên, bấm lưu để áp dụng.')
    } catch (uploadError) {
      setError(getErrorMessage(uploadError))
    } finally {
      setUploading(false)
      event.target.value = ''
    }
  }

  async function handleSaveSettings(event) {
    event.preventDefault()

    setSavingSettings(true)
    setError('')
    setMessage('')

    try {
      const response = await paymentApi.updateTransferSettings(settings)
      setSettings({
        transfer_qr_image: response.data.transfer_qr_image || '',
        transfer_note: response.data.transfer_note || '',
      })
      setMessage('Đã lưu cấu hình chuyển khoản.')
    } catch (saveError) {
      setError(getErrorMessage(saveError))
    } finally {
      setSavingSettings(false)
    }
  }

  return (
    <div className="sp-page">
      <div className="sp-header">
        <div>
          <h1 className="sp-title">Thanh toán</h1>
          <p className="sp-subtitle">Nhận thông báo bàn cần thu tiền và cấu hình QR chuyển khoản cho khách.</p>
        </div>

        <button className="btn btn-ghost" onClick={fetchRequests} disabled={loading}>
          <FiRefreshCw size={16} />
          {loading ? 'Đang tải...' : 'Làm mới'}
        </button>
      </div>

      {error && <div className="amp-feedback amp-feedback--error">{error}</div>}
      {message && <div className="amp-feedback amp-feedback--success">{message}</div>}

      <div className="spp-layout">
        <section className="spp-panel">
          <div className="spp-panel__head">
            <div>
              <h2>Yêu cầu đang chờ</h2>
              <p>{requests.length} bàn cần xử lý</p>
            </div>
            <FiClock size={22} />
          </div>

          {requests.length === 0 ? (
            <div className="sp-empty">Chưa có bàn nào yêu cầu thanh toán.</div>
          ) : (
            <div className="spp-request-list">
              {requests.map((request) => (
                <article key={request.id} className="spp-request-card">
                  <div className="spp-request-card__main">
                    <div className="spp-request-card__icon">
                      {request.method === 'cash' ? <FiDollarSign size={20} /> : <FiCreditCard size={20} />}
                    </div>
                    <div>
                      <h3>{request.table_name}</h3>
                      <p>
                        {request.method === 'cash' ? 'Khách chọn tiền mặt' : 'Khách báo đã chuyển khoản'}
                        {' - '}
                        {formatTime(request.created_at)}
                      </p>
                      <span>Đơn: {request.order_ids.join(', ')}</span>
                    </div>
                  </div>

                  <div className="spp-request-card__side">
                    <strong>{formatPrice(request.total_amount)}</strong>
                    <button
                      className="btn btn-primary"
                      onClick={() => handleComplete(request)}
                      disabled={completingId === request.id}
                    >
                      <FiCheckCircle size={16} />
                      {completingId === request.id ? 'Đang lưu...' : 'Đã thu tiền'}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <form className="spp-panel spp-settings" onSubmit={handleSaveSettings}>
          <div className="spp-panel__head">
            <div>
              <h2>QR chuyển khoản</h2>
              <p>Ảnh này sẽ hiển thị cho khách khi chọn chuyển khoản.</p>
            </div>
            <FiCreditCard size={22} />
          </div>

          <div className="spp-qr-preview">
            {settings.transfer_qr_image ? (
              <img src={settings.transfer_qr_image} alt="QR chuyển khoản" />
            ) : (
              <span>Chưa có QR</span>
            )}
          </div>

          <label className="spp-upload">
            <FiUpload size={16} />
            {uploading ? 'Đang tải ảnh...' : 'Tải ảnh QR'}
            <input type="file" accept="image/*" onChange={handleUploadQr} disabled={uploading} />
          </label>

          <label className="spp-field">
            <span>Ghi chú hiển thị cho khách</span>
            <textarea
              rows={4}
              value={settings.transfer_note || ''}
              onChange={(event) =>
                setSettings((current) => ({ ...current, transfer_note: event.target.value }))
              }
              placeholder="VD: Vui lòng nhập nội dung chuyển khoản là số bàn."
            />
          </label>

          <button className="btn btn-primary" disabled={savingSettings}>
            {savingSettings ? 'Đang lưu...' : 'Lưu cấu hình QR'}
          </button>
        </form>
      </div>
    </div>
  )
}
