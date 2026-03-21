const express = require('express')
const router = express.Router()
const {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/product.controller')

const{ verifyToken, verifyAdmin}= require('../middlewares/auth.middleware')

router.get('/',getAllProducts)
router.get('/:id',getProductById)
router.post('/',verifyAdmin, createProduct)
router.put('/:id',verifyAdmin,updateProduct)
router.delete('/:id',verifyAdmin,deleteProduct)

module.exports=router