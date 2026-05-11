const db = require('../config/db')
const bcrypt = require('bcryptjs')

const VALID_ROLES = ['admin', 'staff', 'kitchen']

const getUsers = async (req, res) => {
  try {
    const { role, search } = req.query
    const clauses = []
    const params = []

    if (role) {
      if (!VALID_ROLES.includes(role)) {
        return res.status(400).json({ message: 'Role không hợp lệ' })
      }

      clauses.push('role = ?')
      params.push(role)
    }

    if (search) {
      clauses.push('username LIKE ?')
      params.push(`%${search}%`)
    }

    const whereClause = clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''
    const [users] = await db.query(
      `SELECT id, username, role FROM users ${whereClause} ORDER BY username ASC`,
      params
    )

    res.json(users)
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message })
  }
}

const createUser = async (req, res) => {
  try {
    const { username, password, role } = req.body

    if (!username || !password || !role) {
      return res.status(400).json({ message: 'Vui lòng nhập đủ thông tin' })
    }

    if (!VALID_ROLES.includes(role)) {
      return res.status(400).json({ message: 'Role không hợp lệ' })
    }

    const trimmedUsername = username.trim()
    if (!trimmedUsername) {
      return res.status(400).json({ message: 'Username không được để trống' })
    }

    const [existing] = await db.query(
      'SELECT id FROM users WHERE username = ?',
      [trimmedUsername]
    )

    if (existing.length > 0) {
      return res.status(400).json({ message: 'Username đã tồn tại' })
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const [result] = await db.query(
      'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
      [trimmedUsername, hashedPassword, role]
    )

    res.status(201).json({
      message: 'Thêm tài khoản thành công',
      user: {
        id: result.insertId,
        username: trimmedUsername,
        role,
      },
    })
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message })
  }
}

const updateUser = async (req, res) => {
  try {
    const { id } = req.params
    const { username, password, role } = req.body

    if (!username || !role) {
      return res.status(400).json({ message: 'Vui lòng nhập đủ thông tin' })
    }

    if (!VALID_ROLES.includes(role)) {
      return res.status(400).json({ message: 'Role không hợp lệ' })
    }

    const trimmedUsername = username.trim()
    if (!trimmedUsername) {
      return res.status(400).json({ message: 'Username không được để trống' })
    }

    const [users] = await db.query(
      'SELECT id FROM users WHERE id = ?',
      [id]
    )

    if (users.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy tài khoản' })
    }

    const [duplicated] = await db.query(
      'SELECT id FROM users WHERE username = ? AND id != ?',
      [trimmedUsername, id]
    )

    if (duplicated.length > 0) {
      return res.status(400).json({ message: 'Username đã tồn tại' })
    }

    if (password && password.trim()) {
      const hashedPassword = await bcrypt.hash(password, 12)
      await db.query(
        'UPDATE users SET username = ?, password = ?, role = ? WHERE id = ?',
        [trimmedUsername, hashedPassword, role, id]
      )
    } else {
      await db.query(
        'UPDATE users SET username = ?, role = ? WHERE id = ?',
        [trimmedUsername, role, id]
      )
    }

    res.json({ message: 'Cập nhật tài khoản thành công' })
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message })
  }
}

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params

    const [users] = await db.query(
      'SELECT id, username FROM users WHERE id = ?',
      [id]
    )

    if (users.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy tài khoản' })
    }

    await db.query('DELETE FROM users WHERE id = ?', [id])

    res.json({ message: `Đã xoá tài khoản ${users[0].username}` })
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message })
  }
}

module.exports = {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
}
