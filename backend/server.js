const express = require('express')
const app = express()
const cors=require('cors')
require('dotenv').config()
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

const db=require('./config/db')
const authRoutes=require('./routes/auth.routes')
const productRoutes=require('./routes/product.routes')
const categoryRoutes=require('./routes/category.routes')
const tableRoutes=require('./routes/table.routes')
const orderRoutes=require('./routes/order.routes')
const userRoutes=require('./routes/user.routes')

app.use(cors())
app.use(express.json())

app.use('/api/auth',authRoutes)
app.use('/api/products', productRoutes)
app.use('/api/categories', categoryRoutes)
app.use('/api/tables', tableRoutes)
app.use('/api/orders',orderRoutes)
app.use('/api/users', userRoutes)

app.get('/', (req, res)=>{
    res.json({message: 'Backend dang chay!'})
})

const PORT = process.env.PORT || 5000
app.listen(PORT, ()=>{
    console.log('Server chay tai http://localhost:${PORT}')
})
