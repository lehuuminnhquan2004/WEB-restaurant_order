const db = require('../config/db')
const { emitChatChanged } = require('../config/socket')

async function ensureChatTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id INT NOT NULL AUTO_INCREMENT,
      table_id INT NOT NULL,
      table_name VARCHAR(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
      sender ENUM('customer','staff') COLLATE utf8mb4_unicode_ci NOT NULL,
      message TEXT COLLATE utf8mb4_unicode_ci NOT NULL,
      created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY table_id (table_id)
    ) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `)
}

function mapMessage(row) {
  return {
    id: row.id,
    table_id: row.table_id,
    table_name: row.table_name || `Bàn ${row.table_id}`,
    sender: row.sender,
    message: row.message,
    created_at: row.created_at,
  }
}

async function insertMessage({ table_id, table_name, sender, message }) {
  await ensureChatTable()

  const trimmedMessage = String(message || '').trim()
  const numericTableId = Number(table_id)
  const nextTableName = table_name || `Bàn ${numericTableId}`

  const [result] = await db.query(
    'INSERT INTO chat_messages (table_id, table_name, sender, message) VALUES (?, ?, ?, ?)',
    [numericTableId, nextTableName, sender, trimmedMessage]
  )

  const [rows] = await db.query(
    'SELECT id, table_id, table_name, sender, message, created_at FROM chat_messages WHERE id = ?',
    [result.insertId]
  )

  return mapMessage(rows[0])
}

const getMessagesByTable = async (req, res) => {
  try {
    await ensureChatTable()

    const tableId = Number(req.params.table_id)
    const [rows] = await db.query(
      `
      SELECT id, table_id, table_name, sender, message, created_at
      FROM chat_messages
      WHERE table_id = ?
      ORDER BY created_at ASC, id ASC
      `,
      [tableId]
    )

    res.json(rows.map(mapMessage))
  } catch (error) {
    res.status(500).json({ message: 'Không thể tải tin nhắn', error: error.message })
  }
}

const getConversations = async (req, res) => {
  try {
    await ensureChatTable()

    const [rows] = await db.query(`
      SELECT cm.id, cm.table_id, cm.table_name, cm.sender, cm.message, cm.created_at,
        totals.count
      FROM chat_messages cm
      INNER JOIN (
        SELECT table_id, MAX(id) AS last_id, COUNT(*) AS count
        FROM chat_messages
        GROUP BY table_id
      ) totals ON totals.last_id = cm.id
      ORDER BY cm.created_at DESC, cm.id DESC
    `)

    res.json(rows.map((row) => ({
      table_id: row.table_id,
      table_name: row.table_name || `Bàn ${row.table_id}`,
      last_message: row.message,
      last_sender: row.sender,
      last_at: row.created_at,
      count: row.count,
    })))
  } catch (error) {
    res.status(500).json({ message: 'Không thể tải hội thoại', error: error.message })
  }
}

const sendCustomerMessage = async (req, res) => {
  try {
    const { table_id, table_name, message } = req.body

    if (!table_id || !String(message || '').trim()) {
      return res.status(400).json({ message: 'Thiếu nội dung tin nhắn' })
    }

    const chatMessage = await insertMessage({
      table_id,
      table_name,
      sender: 'customer',
      message,
    })

    res.status(201).json(chatMessage)
    emitChatChanged({ type: 'message-created', message: chatMessage })
  } catch (error) {
    res.status(500).json({ message: 'Không thể gửi tin nhắn', error: error.message })
  }
}

const sendStaffMessage = async (req, res) => {
  try {
    const { table_id, table_name, message } = req.body

    if (!table_id || !String(message || '').trim()) {
      return res.status(400).json({ message: 'Thiếu nội dung tin nhắn' })
    }

    const chatMessage = await insertMessage({
      table_id,
      table_name,
      sender: 'staff',
      message,
    })

    res.status(201).json(chatMessage)
    emitChatChanged({ type: 'message-created', message: chatMessage })
  } catch (error) {
    res.status(500).json({ message: 'Không thể gửi tin nhắn', error: error.message })
  }
}

async function clearChatByTable(tableId) {
  await ensureChatTable()

  const numericTableId = Number(tableId)
  const [result] = await db.query(
    'DELETE FROM chat_messages WHERE table_id = ?',
    [numericTableId]
  )

  if (result.affectedRows > 0) {
    emitChatChanged({ type: 'table-chat-cleared', tableId: numericTableId })
  }
}

module.exports = {
  getMessagesByTable,
  getConversations,
  sendCustomerMessage,
  sendStaffMessage,
  clearChatByTable,
}
