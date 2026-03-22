const db = require('../config/db')

const getAllCategories = async(req, res)=>{
    try{
        const [rows] = await db.query(`SELECT * FROM categories ORDER BY id`)
        res.json(rows)
    }catch(error){
        res.status(500).json({message: "Lỗi Server", error: error.message})
    }
}

const createCategory = async(req, res)=>{
    try{
        const {name}= req.body
        if(!name){
            return res.status(400).json({message: 'Thiếu dữ liệu tên danh mục'})
        }

        const [result] = await db.query(`INSERT INTO categories (name) VALUES (?)`, [name])

        res.status(201).json({message: 'Thêm danh mục thành công',
            categoryId: result.insertId,
        })
    }catch(error){
        res.status(500).json({message: "Lỗi Server", error: error.message})
    }
}

const updateCategory = async(req, res)=>{
    try{
        const {name}= req.body
        if(!name){
            return res.status(400).json({message: 'Thiếu dữ liệu tên danh mục'})
        }
        const [result] = await db.query(`UPDATE categories SET name = ? WHERE id = ?`,
            [name, req.params.id]
        )

        if(result.affectedRows===0){
            return res.status(404).json({message: 'Không tìm thấy danh mục'})
        }

        res.json({message: 'Cập nhập danh mục thành công'})
    }catch(error){
        res.status(500).json({message: "Lỗi Server", error: error.message})
    }
}

const deleteCategory = async (req, res) => {
  try {
    const [products] = await db.query(
      'SELECT id FROM products WHERE category_id = ?',
      [req.params.id]
    )

    if (products.length > 0) {
      return res.status(400).json({
        message: 'Không thể xóa danh mục đang có món ăn',
      })
    }

    const [result] = await db.query(
      'DELETE FROM categories WHERE id = ?',
      [req.params.id]
    )

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Không tìm thấy danh mục' })
    }

    res.json({ message: 'Xóa danh mục thành công' })
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message })
  }
}

module.exports = {
    getAllCategories,
    createCategory,
    updateCategory,
    deleteCategory
}