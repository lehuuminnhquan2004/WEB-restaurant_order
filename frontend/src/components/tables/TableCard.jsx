import { useEffect, useState } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import tableApi from '../../api/tableApi'
import './TableCard.css'

function getStatusBadgeClass(status) {
  if (!status) return 'table-card__badge table-card__badge--default'

  const normalizedStatus = status.toLowerCase()

  if (normalizedStatus === 'available') {
    return 'table-card__badge table-card__badge--available'
  }

  if (normalizedStatus === 'occupied') {
    return 'table-card__badge table-card__badge--occupied'
  }

  if (normalizedStatus === 'inactive') {
    return 'table-card__badge table-card__badge--inactive'
  }

  return 'table-card__badge table-card__badge--default'
}

function getErrorMessage(error) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    'Co loi xay ra.'
  )
}

export default function TableCard({
  table,
  onRefresh,
  allowRename = true,
  allowReset = true,
  allowDelete = true,
  allowShowQr = true,
  extraActions = null,
}) {
  const [renaming, setRenaming] = useState(false)
  const [newName, setNewName] = useState(table.name ?? '')
  const [confirming, setConfirming] = useState(null)
  const [showQr, setShowQr] = useState(false)
  const [busy, setBusy] = useState(false)
  const [cardError, setCardError] = useState('')

  const canRename = allowRename
  const canReset = allowReset
  const canDelete = allowDelete
  const canShowQr = allowShowQr && !!table.token
  const qrUrl = table.token ? `${window.location.origin}/table/${table.token}` : ''

  useEffect(() => {
    setNewName(table.name ?? '')
  }, [table.name])

  async function runAction(action) {
    setBusy(true)
    setCardError('')

    try {
      await action()
    } catch (error) {
      setCardError(getErrorMessage(error))
    } finally {
      setBusy(false)
    }
  }

  function handleRenameSubmit() {
    const trimmedName = newName.trim()

    if (!canRename || !trimmedName || trimmedName === table.name) {
      setRenaming(false)
      setNewName(table.name ?? '')
      return
    }

    runAction(async () => {
      await tableApi.update(table.id, { name: trimmedName })

      if (typeof onRefresh === 'function') {
        await onRefresh(`Da cap nhat ten ban thanh "${trimmedName}".`)
      }
    })

    setRenaming(false)
  }

  function handleConfirm() {
    if (confirming === 'delete' && canDelete) {
      runAction(async () => {
        setShowQr(false)
        await tableApi.delete(table.id)

        if (typeof onRefresh === 'function') {
          await onRefresh('Da xoa ban thanh cong.')
        }
      })
    }

    if (confirming === 'reset' && canReset) {
      runAction(async () => {
        await tableApi.reset(table.id)

        if (typeof onRefresh === 'function') {
          await onRefresh('Da reset ban thanh cong.')
        }
      })
    }

    setConfirming(null)
  }

  return (
    <>
      {showQr && (
        <div className="table-card__modal-overlay" onClick={() => setShowQr(false)}>
          <div className="table-card__modal" onClick={(event) => event.stopPropagation()}>
            <button
              className="table-card__modal-close"
              onClick={() => setShowQr(false)}
            >
              x
            </button>

            <h2 className="table-card__modal-title">{table.name}</h2>

            <div className="table-card__modal-qr">
              <QRCodeCanvas value={qrUrl} size={220} />
            </div>

            <p className="table-card__modal-text">Quet de vao ban</p>

            <a
              href={qrUrl}
              target="_blank"
              rel="noreferrer"
              className="table-card__modal-link"
            >
              {qrUrl}
            </a>
          </div>
        </div>
      )}

      <div className="table-card">
        <div className="table-card__header">
          <h3 className="table-card__name">{table.name}</h3>
          <span className={getStatusBadgeClass(table.status)}>
            {table.status || '-'}
          </span>
        </div>

        {cardError && (
          <div className="table-card__feedback table-card__feedback--error">
            {cardError}
          </div>
        )}

        {renaming ? (
          <div className="table-card__rename">
            <input
              className="table-card__input"
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') handleRenameSubmit()
                if (event.key === 'Escape') {
                  setRenaming(false)
                  setNewName(table.name ?? '')
                }
              }}
              autoFocus
              disabled={busy}
            />

            <button
              className="table-card__btn table-card__btn--primary"
              onClick={handleRenameSubmit}
              disabled={busy}
            >
              Luu
            </button>

            <button
              className="table-card__btn table-card__btn--ghost"
              onClick={() => {
                setRenaming(false)
                setNewName(table.name ?? '')
              }}
              disabled={busy}
            >
              Huy
            </button>
          </div>
        ) : (
          <div className="table-card__actions">
            {canRename && (
              <button
                className="table-card__btn table-card__btn--ghost"
                onClick={() => {
                  setRenaming(true)
                  setNewName(table.name ?? '')
                  setConfirming(null)
                }}
                disabled={busy}
              >
                Doi ten
              </button>
            )}

            {canReset && (
              <button
                className="table-card__btn table-card__btn--warning"
                onClick={() => {
                  setConfirming('reset')
                  setRenaming(false)
                }}
                disabled={busy}
              >
                Reset
              </button>
            )}

            {canDelete && (
              <button
                className="table-card__btn table-card__btn--danger"
                onClick={() => {
                  setConfirming('delete')
                  setRenaming(false)
                }}
                disabled={busy}
              >
                Xoa
              </button>
            )}

            {canShowQr && (
              <button
                className="table-card__btn table-card__btn--ghost"
                onClick={() => {
                  setRenaming(false)
                  setConfirming(null)
                  setShowQr(true)
                }}
                disabled={busy}
              >
                Xem QR
              </button>
            )}

            {extraActions}
          </div>
        )}

        {confirming && !renaming && (
          <div className="table-card__confirm">
            <p className="table-card__confirm-text">
              {confirming === 'delete'
                ? `Xac nhan xoa ban "${table.name}"?`
                : `Xac nhan reset ban "${table.name}"?`}
            </p>

            <div className="table-card__confirm-actions">
              <button
                className={`table-card__btn ${
                  confirming === 'delete'
                    ? 'table-card__btn--danger'
                    : 'table-card__btn--warning'
                }`}
                onClick={handleConfirm}
                disabled={busy}
              >
                {busy ? 'Dang xu ly...' : 'Xac nhan'}
              </button>

              <button
                className="table-card__btn table-card__btn--ghost"
                onClick={() => setConfirming(null)}
                disabled={busy}
              >
                Huy
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
