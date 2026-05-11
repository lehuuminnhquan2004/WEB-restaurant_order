import { useCallback, useEffect, useRef, useState } from 'react'
import { FiMessageCircle, FiSend } from 'react-icons/fi'
import chatApi from '../../api/chatApi'
import socket from '../../api/socket'
import './StaffBase.css'
import './StaffChatPage.css'

function getErrorMessage(error) {
  return error?.response?.data?.message || error?.message || 'Không thể xử lý yêu cầu.'
}

function formatTime(value) {
  if (!value) return ''
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
  }).format(new Date(value))
}

export default function StaffChatPage() {
  const [conversations, setConversations] = useState([])
  const [selected, setSelected] = useState(null)
  const [messages, setMessages] = useState([])
  const [reply, setReply] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)

  const fetchConversations = useCallback(async () => {
    setError('')

    try {
      const response = await chatApi.getConversations()
      setConversations(response.data || [])
    } catch (fetchError) {
      setError(getErrorMessage(fetchError))
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchMessages = useCallback(async (tableId) => {
    if (!tableId) return

    try {
      const response = await chatApi.getByTable(tableId)
      setMessages(response.data || [])
    } catch (fetchError) {
      setError(getErrorMessage(fetchError))
    }
  }, [])

  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  useEffect(() => {
    if (selected?.table_id) {
      fetchMessages(selected.table_id)
    }
  }, [selected, fetchMessages])

  useEffect(() => {
    if (!socket.connected) {
      socket.connect()
    }

    function handleChatChanged(payload) {
      fetchConversations()

      if (payload?.type === 'table-chat-cleared') {
        if (selected?.table_id === payload.tableId) {
          setMessages([])
          setSelected(null)
        }
        return
      }

      const nextMessage = payload?.message
      if (nextMessage?.table_id === selected?.table_id) {
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
  }, [fetchConversations, selected])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend(event) {
    event.preventDefault()

    const trimmed = reply.trim()
    if (!trimmed || !selected) return

    setSending(true)
    setError('')

    try {
      await chatApi.sendStaff({
        table_id: selected.table_id,
        table_name: selected.table_name,
        message: trimmed,
      })
      setReply('')
    } catch (sendError) {
      setError(getErrorMessage(sendError))
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="sp-page">
      <div className="sp-header">
        <div>
          <h1 className="sp-title">Hỗ trợ khách hàng</h1>
          <p className="sp-subtitle">Nhận và trả lời tin nhắn từ các bàn đang dùng bữa.</p>
        </div>

        <button className="btn btn-ghost" onClick={fetchConversations} disabled={loading}>
          {loading ? 'Đang tải...' : 'Làm mới'}
        </button>
      </div>

      {error && <div className="amp-feedback amp-feedback--error">{error}</div>}

      <div className="scp-layout">
        <aside className="scp-list">
          {conversations.length === 0 ? (
            <div className="scp-empty">Chưa có tin nhắn hỗ trợ nào.</div>
          ) : (
            conversations.map((conversation) => (
              <button
                key={conversation.table_id}
                className={`scp-thread ${selected?.table_id === conversation.table_id ? 'scp-thread--active' : ''}`}
                onClick={() => setSelected(conversation)}
              >
                <div className="scp-thread__icon">
                  <FiMessageCircle size={18} />
                </div>
                <div>
                  <strong>{conversation.table_name}</strong>
                  <p>{conversation.last_message}</p>
                </div>
                <span>{formatTime(conversation.last_at)}</span>
              </button>
            ))
          )}
        </aside>

        <section className="scp-chat">
          {!selected ? (
            <div className="scp-chat__placeholder">
              <FiMessageCircle size={42} />
              <p>Chọn một bàn để xem và trả lời tin nhắn.</p>
            </div>
          ) : (
            <>
              <header className="scp-chat__header">
                <h2>{selected.table_name}</h2>
                <p>{messages.length} tin nhắn</p>
              </header>

              <div className="scp-chat__body">
                {messages.map((item) => (
                  <div key={item.id} className={`scp-message scp-message--${item.sender}`}>
                    <span>{item.sender === 'staff' ? 'Nhân viên' : selected.table_name}</span>
                    <p>{item.message}</p>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              <form className="scp-chat__form" onSubmit={handleSend}>
                <input
                  value={reply}
                  onChange={(event) => setReply(event.target.value)}
                  placeholder="Nhập phản hồi..."
                  maxLength={300}
                />
                <button className="btn btn-primary" disabled={sending || !reply.trim()}>
                  <FiSend size={16} />
                  Gửi
                </button>
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  )
}
