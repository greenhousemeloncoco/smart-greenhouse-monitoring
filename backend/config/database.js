const mysql = require('mysql2');

require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.MYSQLHOST,
    user: process.env.MYSQLUSER,
    password: process.env.MYSQLPASSWORD,
    database: process.env.MYSQLDATABASE,
    port: process.env.MYSQLPORT,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

pool.getConnection((err, connection) => {
    if (err) {
        console.error('❌ DB ERROR:', err);
    } else {
        console.log('✅ MySQL Connected');
        connection.release();
    }
});

module.exports = pool.promise();