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
        console.error('Ket noi database that bai',err.message)
        return
    }
    console.log('Ket noi database thanh cong')
    connection.release()
})

module.exports=pool.promise()