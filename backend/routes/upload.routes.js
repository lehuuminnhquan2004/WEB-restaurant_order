const express = require('express')
const router = express.Router()
const { uploadImage } = require('../controllers/upload.controller')
const { verifyToken } = require('../middlewares/auth.middleware')

function verifyStaffOrAdmin(req, res, next) {
  verifyToken(req, res, () => {
    if (!['staff', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Chỉ staff hoặc admin mới có quyền này' })
    }

    next()
  })
}

router.post('/images', verifyStaffOrAdmin, uploadImage)

module.exports = router
