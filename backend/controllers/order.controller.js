const db = require('../config/db')

const createOrder = async (req, res) => {
  try {
    const { table_id, items } = req.body

    if (!table_id || !items || items.length === 0) {
      return res.status(400).json({ message: 'Thieu thong tin dat mon' })
    }

    const [tables] = await db.query(
      'SELECT * FROM tables WHERE id = ?',
      [table_id]
    )

    if (tables.length === 0) {
      return res.status(404).json({ message: 'Khong tim thay ban' })
    }

    const productIds = items.map((item) => item.product_id)
    const [products] = await db.query(
      'SELECT id, price, status FROM products WHERE id IN (?)',
      [productIds]
    )

    const unavailable = products.filter((product) => product.status === 'unavailable')
    if (unavailable.length > 0) {
      return res.status(400).json({
        message: 'Mot so mon khong co san',
        products: unavailable.map((product) => product.id),
      })
    }

    const priceMap = {}
    products.forEach((product) => {
      priceMap[product.id] = Number(product.price)
    })

    const total_price = items.reduce((sum, item) => {
      const realPrice = priceMap[item.product_id]
      return sum + realPrice * Number(item.quantity || 0)
    }, 0)

    const [order] = await db.query(
      "INSERT INTO orders (table_id, status, total_price) VALUES (?,'pending',?)",
      [table_id, total_price]
    )

    const orderId = order.insertId

    const orderItems = items.flatMap((item) =>
      Array.from({ length: Number(item.quantity) || 0 }, () => ([
        orderId,
        item.product_id,
        1,
        priceMap[item.product_id],
        item.note || null,
        'pending',
      ]))
    )

    await db.query(
      'INSERT INTO order_items (order_id, product_id, quantity, price, note, status) VALUES ?',
      [orderItems]
    )

    res.status(201).json({
      message: 'Dat mon thanh cong',
      orderId,
      total_price,
    })
  } catch (error) {
    res.status(500).json({ message: 'Loi server', error: error.message })
  }
}

const getOrdersByTable = async (req, res) => {
  try {
    const [orders] = await db.query(
      "SELECT * FROM orders WHERE table_id = ? AND status != 'paid' ORDER BY created_at DESC",
      [req.params.table_id]
    )

    if (orders.length === 0) {
      return res.json([])
    }

    const orderIds = orders.map((order) => order.id)

    const [items] = await db.query(
      `SELECT oi.*, p.name AS product_name, p.image
       FROM order_items oi
       LEFT JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id IN (?)`,
      [orderIds]
    )

    const result = orders.map((order) => ({
      ...order,
      items: items.filter((item) => item.order_id === order.id),
    }))

    res.json(result)
  } catch (error) {
    res.status(500).json({ message: 'Loi server', error: error.message })
  }
}

const getAllOrders = async (req, res) => {
  try {
    const { status } = req.query
    const validStatuses = ['pending', 'confirmed', 'preparing', 'done', 'paid']

    let whereClause = ''
    let params = []

    if (status) {
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: 'Trang thai khong hop le' })
      }

      whereClause = 'WHERE o.status = ?'
      params = [status]
    }

    const [orders] = await db.query(
      `SELECT o.*, t.name AS table_name
       FROM orders o
       LEFT JOIN tables t ON o.table_id = t.id
       ${whereClause}
       ORDER BY o.created_at DESC`,
      params
    )

    if (orders.length === 0) {
      return res.json([])
    }

    const orderIds = orders.map((order) => order.id)

    const [items] = await db.query(
      `SELECT oi.*, p.name AS product_name
       FROM order_items oi
       LEFT JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id IN (?)`,
      [orderIds]
    )

    const result = orders.map((order) => ({
      ...order,
      items: items.filter((item) => item.order_id === order.id),
    }))

    res.json(result)
  } catch (error) {
    res.status(500).json({ message: 'Loi server', error: error.message })
  }
}

const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body
    const validStatuses = ['pending', 'confirmed', 'preparing', 'done', 'paid']

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Trang thai khong hop le' })
    }

    const [orders] = await db.query(
      'SELECT id, table_id FROM orders WHERE id = ?',
      [req.params.id]
    )

    if (orders.length === 0) {
      return res.status(404).json({ message: 'Khong tim thay order' })
    }

    const tableId = orders[0].table_id

    if (status === 'paid') {
      const [items] = await db.query(
        'SELECT status FROM order_items WHERE order_id = ?',
        [req.params.id]
      )

      const allServed = items.length > 0 && items.every((item) => item.status === 'served')

      if (!allServed) {
        return res.status(400).json({
          message: 'Chi duoc thanh toan khi tat ca mon da duoc phuc vu',
        })
      }
    }

    await db.query(
      'UPDATE orders SET status = ? WHERE id = ?',
      [status, req.params.id]
    )

    if (status === 'confirmed') {
      await db.query(
        'UPDATE tables SET status = ? WHERE id = ?',
        ['occupied', tableId]
      )
    }

    if (status === 'paid') {
      const [unpaidOrders] = await db.query(
        "SELECT id FROM orders WHERE table_id = ? AND status != 'paid'",
        [tableId]
      )

      if (unpaidOrders.length === 0) {
        await db.query(
          'UPDATE tables SET status = ? WHERE id = ?',
          ['available', tableId]
        )
      }
    }

    res.json({ message: `Cap nhat trang thai thanh cong: ${status}` })
  } catch (error) {
    res.status(500).json({ message: 'Loi server', error: error.message })
  }
}

const updateOrderItemStatus = async (req, res) => {
  try {
    const { status } = req.body
    const { id, item_id } = req.params

    if (!['pending', 'done', 'served'].includes(status)) {
      return res.status(400).json({ message: 'Trang thai khong hop le' })
    }

    const [result] = await db.query(
      'UPDATE order_items SET status = ? WHERE id = ?',
      [status, item_id]
    )

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Khong tim thay mon' })
    }

    if (status === 'done') {
      const [items] = await db.query(
        'SELECT status FROM order_items WHERE order_id = ?',
        [id]
      )

      const allDone = items.every((item) => ['done', 'served'].includes(item.status))

      if (allDone) {
        await db.query(
          'UPDATE orders SET status = ? WHERE id = ?',
          ['done', id]
        )
      }
    }

    if (status === 'served') {
      const [items] = await db.query(
        'SELECT status FROM order_items WHERE order_id = ?',
        [id]
      )

      const allServed = items.every((item) => item.status === 'served')

      if (allServed) {
        await db.query(
          'UPDATE orders SET status = ? WHERE id = ?',
          ['done', id]
        )
      }
    }

    res.json({ message: 'Cap nhat trang thai mon thanh cong' })
  } catch (error) {
    res.status(500).json({ message: 'Loi server', error: error.message })
  }
}

const removeOrderItem = async (req, res) => {
  try {
    const { id, item_id } = req.params

    const [orders] = await db.query(
      'SELECT status FROM orders WHERE id = ?',
      [id]
    )

    if (orders.length === 0) {
      return res.status(404).json({ message: 'Khong tim thay order' })
    }

    if (['preparing', 'done', 'paid'].includes(orders[0].status)) {
      return res.status(400).json({
        message: 'Khong the xoa mon da bat dau che bien',
      })
    }

    const [items] = await db.query(
      'SELECT * FROM order_items WHERE id = ? AND order_id = ?',
      [item_id, id]
    )

    if (items.length === 0) {
      return res.status(404).json({ message: 'Khong tim thay mon' })
    }

    await db.query(
      'DELETE FROM order_items WHERE id = ?',
      [item_id]
    )

    const [remaining] = await db.query(
      'SELECT * FROM order_items WHERE order_id = ?',
      [id]
    )

    if (remaining.length === 0) {
      await db.query('DELETE FROM orders WHERE id = ?', [id])
      return res.json({ message: 'Da xoa mon va huy order vi khong con mon nao' })
    }

    const newTotal = remaining.reduce(
      (sum, item) => sum + Number(item.price) * Number(item.quantity),
      0
    )

    await db.query(
      'UPDATE orders SET total_price = ? WHERE id = ?',
      [newTotal, id]
    )

    res.json({ message: 'Xoa mon thanh cong', total_price: newTotal })
  } catch (error) {
    res.status(500).json({ message: 'Loi server', error: error.message })
  }
}

module.exports = {
  createOrder,
  getOrdersByTable,
  getAllOrders,
  updateOrderStatus,
  updateOrderItemStatus,
  removeOrderItem,
}
