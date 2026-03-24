const express = require('express')
const router = express.Router()
const {
  createOrder,
  getOrdersByTable,
  getAllOrders,
  updateOrderStatus,
  updateOrderItemStatus,
  removeOrderItem,         
} = require('../controllers/order.controller')
const { verifyToken } = require('../middlewares/auth.middleware')

router.post('/', createOrder)
router.get('/', verifyToken, getAllOrders)
router.get('/table/:table_id', getOrdersByTable)
router.put('/:id/status', verifyToken, updateOrderStatus)
router.put('/:id/items/:item_id/status', verifyToken, updateOrderItemStatus)
router.delete('/:id/items/:item_id',verifyToken,removeOrderItem)

module.exports = router