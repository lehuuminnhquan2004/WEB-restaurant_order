const db = require('../config/db')
const { emitOrdersChanged, emitPaymentsChanged } = require('../config/socket')
const { clearChatByTable } = require('./chat.controller')

async function ensurePaymentTables() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS payment_requests (
      id INT NOT NULL AUTO_INCREMENT,
      table_id INT NOT NULL,
      table_name VARCHAR(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
      method ENUM('cash','transfer') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'cash',
      status ENUM('pending','completed','cancelled') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
      total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      order_ids TEXT COLLATE utf8mb4_unicode_ci,
      created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY table_id (table_id),
      KEY status (status)
    ) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `)

  await db.query(`
    CREATE TABLE IF NOT EXISTS payment_settings (
      id INT NOT NULL,
      transfer_qr_image VARCHAR(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
      transfer_note VARCHAR(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
      updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id)
    ) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `)

  const [[settings]] = await db.query('SELECT COUNT(*) AS total FROM payment_settings')
  if (Number(settings.total) === 0) {
    await db.query(
      'INSERT INTO payment_settings (id, transfer_qr_image, transfer_note) VALUES (?, ?, ?)',
      [1, '', 'Vui lòng chuyển khoản theo mã QR và báo nhân viên sau khi hoàn tất.']
    )
  }
}

function parseOrderIds(value) {
  if (Array.isArray(value)) return value.map(Number).filter(Boolean)

  try {
    return JSON.parse(value || '[]').map(Number).filter(Boolean)
  } catch {
    return []
  }
}

function mapPaymentRequest(row) {
  return {
    id: row.id,
    table_id: row.table_id,
    table_name: row.table_name || `Bàn ${row.table_id}`,
    method: row.method,
    status: row.status,
    total_amount: Number(row.total_amount || 0),
    order_ids: parseOrderIds(row.order_ids),
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

async function validateOrdersReady(tableId, orderIds) {
  const ids = orderIds.map(Number).filter(Boolean)

  if (ids.length === 0) {
    return { ok: false, message: 'Không có đơn cần thanh toán' }
  }

  const [orders] = await db.query(
    `SELECT id, table_id, status
     FROM orders
     WHERE id IN (?) AND table_id = ? AND status != 'paid'`,
    [ids, tableId]
  )

  if (orders.length !== ids.length) {
    return { ok: false, message: 'Danh sách đơn thanh toán không hợp lệ' }
  }

  const [items] = await db.query(
    'SELECT status FROM order_items WHERE order_id IN (?)',
    [ids]
  )

  const allServed = items.length > 0 && items.every((item) => item.status === 'served')
  if (!allServed) {
    return { ok: false, message: 'Chỉ được thanh toán khi tất cả món đã được phục vụ' }
  }

  return { ok: true }
}

const getTransferSettings = async (req, res) => {
  try {
    await ensurePaymentTables()

    const [[settings]] = await db.query(
      'SELECT transfer_qr_image, transfer_note FROM payment_settings WHERE id = 1'
    )

    res.json({
      transfer_qr_image: settings?.transfer_qr_image || '',
      transfer_note: settings?.transfer_note || '',
    })
  } catch (error) {
    res.status(500).json({ message: 'Không thể tải cấu hình thanh toán', error: error.message })
  }
}

const updateTransferSettings = async (req, res) => {
  try {
    await ensurePaymentTables()

    const transferQrImage = String(req.body.transfer_qr_image || '').trim()
    const transferNote = String(req.body.transfer_note || '').trim()

    await db.query(
      'UPDATE payment_settings SET transfer_qr_image = ?, transfer_note = ? WHERE id = 1',
      [transferQrImage, transferNote]
    )

    res.json({
      message: 'Cập nhật QR chuyển khoản thành công',
      transfer_qr_image: transferQrImage,
      transfer_note: transferNote,
    })
  } catch (error) {
    res.status(500).json({ message: 'Không thể cập nhật cấu hình thanh toán', error: error.message })
  }
}

const createPaymentRequest = async (req, res) => {
  try {
    await ensurePaymentTables()

    const tableId = Number(req.body.table_id)
    const tableName = req.body.table_name || `Bàn ${tableId}`
    const method = req.body.method
    const orderIds = parseOrderIds(req.body.order_ids)
    const totalAmount = Number(req.body.total_amount || 0)

    if (!tableId || !['cash', 'transfer'].includes(method)) {
      return res.status(400).json({ message: 'Thông tin thanh toán không hợp lệ' })
    }

    const validation = await validateOrdersReady(tableId, orderIds)
    if (!validation.ok) {
      return res.status(400).json({ message: validation.message })
    }

    const [existing] = await db.query(
      'SELECT * FROM payment_requests WHERE table_id = ? AND status = ? ORDER BY created_at DESC LIMIT 1',
      [tableId, 'pending']
    )

    if (existing.length > 0) {
      return res.status(200).json(mapPaymentRequest(existing[0]))
    }

    const [result] = await db.query(
      `INSERT INTO payment_requests (table_id, table_name, method, status, total_amount, order_ids)
       VALUES (?, ?, ?, 'pending', ?, ?)`,
      [tableId, tableName, method, totalAmount, JSON.stringify(orderIds)]
    )

    const [rows] = await db.query('SELECT * FROM payment_requests WHERE id = ?', [result.insertId])
    const paymentRequest = mapPaymentRequest(rows[0])

    res.status(201).json(paymentRequest)
    emitPaymentsChanged({ type: 'payment-request-created', payment: paymentRequest })
  } catch (error) {
    res.status(500).json({ message: 'Không thể tạo yêu cầu thanh toán', error: error.message })
  }
}

const getPendingPaymentRequests = async (req, res) => {
  try {
    await ensurePaymentTables()

    const [rows] = await db.query(
      "SELECT * FROM payment_requests WHERE status = 'pending' ORDER BY created_at ASC"
    )

    res.json(rows.map(mapPaymentRequest))
  } catch (error) {
    res.status(500).json({ message: 'Không thể tải yêu cầu thanh toán', error: error.message })
  }
}

const completePaymentRequest = async (req, res) => {
  try {
    await ensurePaymentTables()

    const [rows] = await db.query('SELECT * FROM payment_requests WHERE id = ?', [req.params.id])
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy yêu cầu thanh toán' })
    }

    const payment = mapPaymentRequest(rows[0])
    const validation = await validateOrdersReady(payment.table_id, payment.order_ids)
    if (!validation.ok) {
      return res.status(400).json({ message: validation.message })
    }

    await db.query("UPDATE orders SET status = 'paid' WHERE id IN (?)", [payment.order_ids])
    await db.query("UPDATE payment_requests SET status = 'completed' WHERE id = ?", [payment.id])

    const [unpaidOrders] = await db.query(
      "SELECT id FROM orders WHERE table_id = ? AND status != 'paid'",
      [payment.table_id]
    )

    if (unpaidOrders.length === 0) {
      await db.query('UPDATE tables SET status = ? WHERE id = ?', ['available', payment.table_id])
      await clearChatByTable(payment.table_id)
    }

    res.json({ message: 'Đã xác nhận thanh toán', paymentId: payment.id })
    emitPaymentsChanged({ type: 'payment-request-completed', paymentId: payment.id })
    emitOrdersChanged({
      type: 'payment-completed',
      tableId: payment.table_id,
      orderIds: payment.order_ids,
      status: 'paid',
    })
  } catch (error) {
    res.status(500).json({ message: 'Không thể xác nhận thanh toán', error: error.message })
  }
}

module.exports = {
  getTransferSettings,
  updateTransferSettings,
  createPaymentRequest,
  getPendingPaymentRequests,
  completePaymentRequest,
}
