const express = require('express')
const app = express()
const cors=require('cors')
require('dotenv').config()

const db=require('./config/db')
const authRoutes=require('./routes/auth.routes')
const productRoutes=require('./routes/product.routes')
const categoryRoutes=require('./routes/category.routes')

app.use(cors())
app.use(express.json())

app.use('/api/auth',authRoutes)
app.use('/api/products', productRoutes)
app.use('/api/categories', categoryRoutes)

app.get('/', (req, res)=>{
    res.json({message: 'Backend dang chay!'})
})

const PORT = process.env.PORT || 5000
app.listen(PORT, ()=>{
    console.log('Server chay tai http://localhost:${PORT}')
})
