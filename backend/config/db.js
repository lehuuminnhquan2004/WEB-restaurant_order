const mysql2 = require('mysql2')
require('dotenv').config()

const pool = mysql2.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
})

pool.getConnection((err, connection)=>{
    if(err){
        console.error('Kết nối database thất bại',err.message)
        return
    }
    console.log('Kết nối database thành công')
    connection.release()
})

module.exports=pool.promise()
