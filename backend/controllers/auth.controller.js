const db = require('../config/db')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const login = async (req, res) => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      return res.status(400).json({ message: 'Vui lòng nhập đủ thông tin' })
    }

    const [rows] = await db.query(
      'SELECT * FROM users WHERE username = ?',
      [username]
    )

    if (rows.length === 0) {
      return res.status(401).json({ message: 'Tài khoản không tồn tại' })
    }

    const user = rows[0]

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(401).json({ message: 'Sai mật khẩu' })
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    )

    res.json({
      message: 'Đăng nhập thành công',
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    })
  } catch (error) {
     console.error('Login error:', error.message)
    res.status(500).json({ message: 'Lỗi server', error: error.message })
  }
}

module.exports = { login }