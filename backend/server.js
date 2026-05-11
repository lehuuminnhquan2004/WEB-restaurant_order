const express = require('express')
const app = express()
const http = require('http')
const { Server } = require('socket.io')
const cors=require('cors')
require('dotenv').config()
app.use(express.json({ limit: '8mb' }))
app.use(express.urlencoded({ extended: true, limit: '8mb' }))

const db=require('./config/db')
const authRoutes=require('./routes/auth.routes')
const productRoutes=require('./routes/product.routes')
const categoryRoutes=require('./routes/category.routes')
const tableRoutes=require('./routes/table.routes')
const orderRoutes=require('./routes/order.routes')
const userRoutes=require('./routes/user.routes')
const bannerRoutes=require('./routes/banner.routes')
const uploadRoutes=require('./routes/upload.routes')
const chatRoutes=require('./routes/chat.routes')
const paymentRoutes=require('./routes/payment.routes')
const path=require('path')
const { setSocketIo } = require('./config/socket')

app.use(cors())
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

app.use('/api/auth',authRoutes)
app.use('/api/products', productRoutes)
app.use('/api/categories', categoryRoutes)
app.use('/api/tables', tableRoutes)
app.use('/api/orders',orderRoutes)
app.use('/api/users', userRoutes)
app.use('/api/banners', bannerRoutes)
app.use('/api/uploads', uploadRoutes)
app.use('/api/chats', chatRoutes)
app.use('/api/payments', paymentRoutes)

app.get('/', (req, res)=>{
    res.json({message: 'Backend đang chạy!'})
})

const PORT = process.env.PORT || 5000
const server = http.createServer(app)
const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
    },
})

setSocketIo(io)

io.on('connection', (socket) => {
    console.log(`Client realtime connected: ${socket.id}`)
})

server.listen(PORT, ()=>{
    console.log(`Server chạy tại http://localhost:${PORT}`)
})
