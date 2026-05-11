import { useEffect, useRef, useState } from 'react'
import { FiMessageCircle, FiSend, FiX } from 'react-icons/fi'
import chatApi from '../../api/chatApi'
import socket from '../../api/socket'
import useTableStore from '../../store/tableStore'
import './CustomerSupportChat.css'

function getErrorMessage(error) {
  return error?.response?.data?.message || error?.message || 'Không thể gửi tin nhắn.'
}

export default function CustomerSupportChat() {
  const { tableId, tableName } = useTableStore()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    if (!tableId) return

    chatApi.getByTable(tableId)
      .then((res) => setMessages(res.data || []))
      .catch(() => {})
  }, [tableId])

  useEffect(() => {
    if (!tableId) return

    if (!socket.connected) {
      socket.connect()
    }

    function handleChatChanged(payload) {
      if (payload?.type === 'table-chat-cleared' && payload.tableId === tableId) {
        setMessages([])
        return
      }

      const nextMessage = payload?.message
      if (nextMessage?.table_id === tableId) {
        setMessages((current) =>
          current.some((item) => item.id === nextMessage.id)
            ? current
            : [...current, nextMessage]
        )
      }
    }

    socket.on('chat:changed', handleChatChanged)

    return () => {
      socket.off('chat:changed', handleChatChanged)
    }
  }, [tableId])

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, open])

  async function handleSend(event) {
    event.preventDefault()

    const trimmed = message.trim()
    if (!trimmed || !tableId) return

    setSending(true)
    setError('')

    try {
      await chatApi.sendCustomer({
        table_id: tableId,
        table_name: tableName,
        message: trimmed,
      })
      setMessage('')
    } catch (sendError) {
      setError(getErrorMessage(sendError))
    } finally {
      setSending(false)
    }
  }

  if (!tableId) return null

  return (
    <>
      <button className="customer-chat-fab" onClick={() => setOpen(true)}>
        <FiMessageCircle size={22} />
        Hỗ trợ
      </button>

      {open && (
        <div className="customer-chat-backdrop" onClick={() => setOpen(false)}>
          <section className="customer-chat-sheet" onClick={(event) => event.stopPropagation()}>
            <header className="customer-chat-header">
              <div>
                <h2>Hỗ trợ nhân viên</h2>
                <p>{tableName || `Bàn ${tableId}`}</p>
              </div>
              <button onClick={() => setOpen(false)}>
                <FiX size={18} />
              </button>
            </header>

            <div className="customer-chat-body">
              {messages.length === 0 ? (
                <div className="customer-chat-empty">Gửi tin nhắn nếu bạn cần nhân viên hỗ trợ.</div>
              ) : (
                messages.map((item) => (
                  <div
                    key={item.id}
                    className={`customer-chat-msg customer-chat-msg--${item.sender}`}
                  >
                    <span>{item.sender === 'staff' ? 'Nhân viên' : 'Bạn'}</span>
                    <p>{item.message}</p>
                  </div>
                ))
              )}
              <div ref={bottomRef} />
            </div>

            {error && <div className="customer-chat-error">{error}</div>}

            <form className="customer-chat-form" onSubmit={handleSend}>
              <input
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Nhập tin nhắn..."
                maxLength={300}
              />
              <button disabled={sending || !message.trim()}>
                <FiSend size={16} />
              </button>
            </form>
          </section>
        </div>
      )}
    </>
  )
}
