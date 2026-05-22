// config/database.js
const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,

    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,

    timezone: '+07:00'
});

// Test database connection
async function testConnection() {
    try {
        const connection = await pool.getConnection();

        console.log('✅ MySQL Database connected successfully');

        connection.release();
    } catch (error) {
        console.error('❌ Database connection failed:');
        console.error(error);
    }
}

testConnection();

module.exports = pool;