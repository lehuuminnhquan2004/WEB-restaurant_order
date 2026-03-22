const express = require('express')
const router=express.Router()

const {
    getAllCategories,
    createCategory,
    updateCategory,
    deleteCategory
} = require('../controllers/category.controller')

const {verifyAdmin}= require('../middlewares/auth.middleware')

router.get('/',getAllCategories)
router.post('/',verifyAdmin,createCategory)
router.put('/:id', verifyAdmin,updateCategory)
router.delete('/:id', verifyAdmin, deleteCategory)

module.exports=router
