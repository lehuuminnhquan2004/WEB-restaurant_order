const db = require('../config/db')
const crypto = require('crypto')

const getAllTables = async (req, res) => {
    try {
        const [rows] = await db.query(`SELECT t.*, ts.token
            FROM tables t
            LEFT JOIN table_sessions ts ON t.id = ts.table_id
            ORDER BY t.id
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
        const token = crypto.randomBytes(32).toString('hex')

        const [result] = await db.query(
            `INSERT INTO tables (name, qr_code) VALUES (?, ?)`,
            [name, '']
        )
        const tableId = result.insertId

        await db.query(
            `UPDATE tables SET qr_code = ? WHERE id = ?`,
            [`/table/${tableId}`, tableId]
        )

        await db.query(`INSERT INTO table_sessions (table_id, token) VALUES (?,?)`,
            [tableId, token]
        )
        res.status(201).json({
            message: 'Thêm bàn thành công',
            tableId,
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

const deleteTable = async (req,res)=>{
    try{
        await db.query(`DELETE FROM table_sessions WHERE table_id=?`,
            [req.params.id]
        )
        const [result]=await db.query(`DELETE FROM tables WHERE id = ?`,
            [req.params.id]
        )

        if(result.affectedRows===0){
            return res.status(404).json({message: 'Không tìm thấy bàn'})
        }

        res.json({message: 'Xoá bàn thành công'})
    }catch(error){
        res.status(500).json({message: 'Lỗi Server', error: error.message})
    }
}

const resetTable = async (req,res)=>{
    try{
        const {id}=req.params

        await db.query(`UPDATE tables SET status=? WHERE id=?`,
            ['available',id]
        )

        const newToken = crypto.randomBytes(32).toString('hex')

        await db.query(`
            INSERT INTO table_sessions (table_id, token) VALUES (?,?)
            ON DUPLICATE KEY UPDATE token = ?`,
            [id, newToken, newToken]
        )

        res.json({
            message:'Reset bàn thành công',
            token: newToken,
        })
    }catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message })
    }
}

const verifyTableToken = async(req,res)=>{
    try{
        const {token}=req.params

        const [rows] = await db.query(`
            SELECT t.*, ts.token
            FROM tables t
            LEFT JOIN table_sessions ts
            ON t.id = ts.table_id
            WHERE ts.token=?`,
            [token]
        )

        if(rows.length===0){
            return res.status(401).json({message: 'Token không hợp lệ'})
        }

        const table = rows[0]

        await db.query(`
            UPDATE tables SET status = ? WHERE id = ?`,
            ['occupied',table.id]
        )

        res.json({
            message:'Xác thực bàn thành công',
            table: {
                id: table.id,
                name: table.name,
                status: 'occupied',
            }
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