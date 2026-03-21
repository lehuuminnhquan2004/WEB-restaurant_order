const db = require('../config/db')

const getAllProducts = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT p.*, c.name as category_name
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            ORDER BY p.category_id
        `)
        res.json(rows)
    } catch (error) {
        res.status(500).json({ message: 'Loi server', error: error.message })
    }
}

const getProductById = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT p.*, c.name as category_name
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.id=?`,
        [req.params.id]
        )
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy món ăn' })
        }
        res.json(rows[0])
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message })
    }
}

const createProduct = async (req, res) => {
    try {
        const { name, price, image, description, category_id, status } = req.body

        if (!name || !price || !category_id) {
            return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' })
        }

        const [result] = await db.query(
            `INSERT INTO products (name, price, image, description, category_id, status)
            VALUES(?,?,?,?,?,?)`,
            [name, price, image || null, description || null, category_id, status || 'available']
        )
        res.status(201).json({
            message: 'Thêm món ăn thành công',
            productId: result.insertId,
        })
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message })
    }
}
const updateProduct = async (req, res) => {
    try {
        const { name, price, image, description, category_id, status } = req.body

        const [result] = await db.query(
            `UPDATE products
            SET name = ?, price = ?, image = ?, description = ?, category_id = ?, status = ?
            WHERE id = ?`,
            [name, price, image, description, category_id, status, req.params.id]
        )
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Không tìm thấy món ăn' })
        }
        res.json({ message: 'Cập nhập món ăn thành công' })
    } catch (error) {
        res.status(500).json({ message: 'Lỗi Server', error: error.message })
    }
}
const deleteProduct = async (req, res) => {
    try {
        const [result] = await db.query(
            'DELETE FROM products WHERE id = ?',
            [req.params.id]
        )

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Không tìm thấy món ăn' })
        }

        res.json({ message: 'Xóa món ăn thành công' })
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message })
    }
}

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
}