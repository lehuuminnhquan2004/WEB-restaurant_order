const express = require('express')
const router= express.Router()
const {
  getAllTables,
  createTable,
  updateTable,
  deleteTable,
  resetTable,
  verifyTableToken,
} = require('../controllers/table.controller')
const { verifyAdmin, verifyToken } = require('../middlewares/auth.middleware')

router.get('/',verifyToken,getAllTables)
router.post('/',verifyAdmin,createTable)
router.put('/:id',verifyAdmin,updateTable)
router.delete('/:id',verifyAdmin,deleteTable)
router.post('/:id/reset',verifyToken,resetTable)
router.get('/verify/:token', verifyTableToken)

module.exports = router