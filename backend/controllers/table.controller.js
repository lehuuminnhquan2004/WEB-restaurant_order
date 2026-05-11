const db = require('../config/db')
const crypto = require('crypto')

const getAllTables = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT id, name, status, token
      FROM tables
      ORDER BY id
    `)

    res.json(rows)
  } catch (error) {
    res.status(500).json({ message: 'Lỗi Server', error: error.message })
  }
}

const createTable = async (req, res) => {
  try {
    const { name } = req.body

    if (!name) {
      return res.status(400).json({ message: 'Thiếu dữ liệu tên bàn' })
    }

    const token = crypto.randomBytes(16).toString('hex')

    const [result] = await db.query(
      `INSERT INTO tables (name, token, status) VALUES (?, ?, ?)`,
      [name, token, 'available']
    )

    res.status(201).json({
      message: 'Thêm bàn thành công',
      tableId: result.insertId,
      token,
    })
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message })
  }
}

const updateTable = async (req, res) => {
  try {
    const { name } = req.body

    if (!name) {
      return res.status(400).json({ message: 'Vui lòng nhập tên bàn' })
    }

    const [result] = await db.query(
      'UPDATE tables SET name = ? WHERE id = ?',
      [name, req.params.id]
    )

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Không tìm thấy bàn' })
    }

    res.json({ message: 'Cập nhật bàn thành công' })
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message })
  }
}

const deleteTable = async (req, res) => {
  try {
    const [result] = await db.query(
      `DELETE FROM tables WHERE id = ?`,
      [req.params.id]
    )

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Không tìm thấy bàn' })
    }

    res.json({ message: 'Xoá bàn thành công' })
  } catch (error) {
    res.status(500).json({ message: 'Lỗi Server', error: error.message })
  }
}

const resetTable = async (req, res) => {
  try {
    const { id } = req.params

    const [activeOrders] = await db.query(
      `
      SELECT id, status
      FROM orders
      WHERE table_id = ?
        AND status IN ('confirmed', 'preparing', 'done')
      `,
      [id]
    )

    if (activeOrders.length > 0) {
      return res.status(400).json({
        message: 'Không thể reset bàn đang có đơn đã xác nhận',
      })
    }

    const token = crypto.randomBytes(16).toString('hex')

    const [result] = await db.query(
      `UPDATE tables SET status = ?, token = ? WHERE id = ?`,
      ['available', token, id]
    )

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Không tìm thấy bàn' })
    }

    res.json({
      message: 'Reset bàn thành công',
      token,
    })
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message })
  }
}

const verifyTableToken = async (req, res) => {
  try {
    const { token } = req.params

    const [rows] = await db.query(
      `
      SELECT id, name, status, token
      FROM tables
      WHERE token = ?
      `,
      [token]
    )

    if (rows.length === 0) {
      return res.status(401).json({ message: 'Token không hợp lệ' })
    }

    const table = rows[0]

    res.json({
      message: 'Xác thực bàn thành công',
      table: {
        id: table.id,
        name: table.name,
        status: table.status,
        token: table.token,
      },
    })
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message })
  }
}

module.exports = {
  getAllTables,
  createTable,
  updateTable,
  deleteTable,
  resetTable,
  verifyTableToken,
}
