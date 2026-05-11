const express = require('express')
const router = express.Router()
const {
  getTransferSettings,
  updateTransferSettings,
  createPaymentRequest,
  getPendingPaymentRequests,
  completePaymentRequest,
} = require('../controllers/payment.controller')
const { verifyToken } = require('../middlewares/auth.middleware')

function verifyStaffOrAdmin(req, res, next) {
  verifyToken(req, res, () => {
    if (!['staff', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Chỉ staff hoặc admin mới có quyền này' })
    }

    next()
  })
}

router.get('/transfer-settings', getTransferSettings)
router.put('/transfer-settings', verifyStaffOrAdmin, updateTransferSettings)
router.post('/requests', createPaymentRequest)
router.get('/requests', verifyStaffOrAdmin, getPendingPaymentRequests)
router.put('/requests/:id/complete', verifyStaffOrAdmin, completePaymentRequest)

module.exports = router
