const express = require('express')
const router = express.Router()
const {
  getMessagesByTable,
  getConversations,
  sendCustomerMessage,
  sendStaffMessage,
} = require('../controllers/chat.controller')
const { verifyToken } = require('../middlewares/auth.middleware')

function verifyStaffOrAdmin(req, res, next) {
  verifyToken(req, res, () => {
    if (!['staff', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Chỉ staff hoặc admin mới có quyền này' })
    }

    next()
  })
}

router.get('/table/:table_id', getMessagesByTable)
router.post('/customer', sendCustomerMessage)
router.get('/conversations', verifyStaffOrAdmin, getConversations)
router.post('/staff', verifyStaffOrAdmin, sendStaffMessage)

module.exports = router
