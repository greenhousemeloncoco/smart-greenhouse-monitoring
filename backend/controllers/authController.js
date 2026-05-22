// controllers/authController.js

const jwt = require('jsonwebtoken');
const db = require('../config/database');
require('dotenv').config();

// ============================================
// LOGIN CONTROLLER
// ============================================
const login = async (req, res) => {

    try {

        const { username, password } = req.body;

        console.log('================ LOGIN DEBUG ================');
        console.log('Username Input:', username);
        console.log('Password Input:', password);

        // ============================================
        // VALIDASI INPUT
        // ============================================
        if (!username || !password) {

            return res.status(400).json({
                success: false,
                message: 'Username and password are required'
            });

        }

        // ============================================
        // CEK USER DI DATABASE
        // ============================================
        const [rows] = await db.execute(
            'SELECT * FROM admins WHERE username = ? LIMIT 1',
            [username]
        );

        console.log('Database Result:', rows);

        // ============================================
        // USER TIDAK DITEMUKAN
        // ============================================
        if (rows.length === 0) {

            console.log('Username not found');

            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });

        }

        const admin = rows[0];

        console.log('Database User Found:', admin.username);
        console.log('Database Password:', admin.password);

        // ============================================
        // PLAIN PASSWORD CHECK
        // ============================================
        const passwordMatch = password === admin.password;

        console.log('Password Match:', passwordMatch);

        // ============================================
        // PASSWORD SALAH
        // ============================================
        if (!passwordMatch) {

            console.log('Password does not match');

            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });

        }

        // ============================================
        // JWT SECRET CHECK
        // ============================================
        if (!process.env.JWT_SECRET) {

            return res.status(500).json({
                success: false,
                message: 'JWT_SECRET is missing'
            });

        }

        // ============================================
        // GENERATE TOKEN
        // ============================================
        const token = jwt.sign(
            {
                id: admin.id,
                username: admin.username
            },
            process.env.JWT_SECRET,
            {
                expiresIn: process.env.JWT_EXPIRES_IN || '24h'
            }
        );

        console.log('✅ Login Success');
        console.log('============================================');

        // ============================================
        // SUCCESS RESPONSE
        // ============================================
        return res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                token,
                admin: {
                    id: admin.id,
                    username: admin.username,
                    full_name: admin.full_name,
                    email: admin.email
                }
            }
        });

    } catch (error) {

        console.error('❌ Login Error:', error);

        return res.status(500).json({
            success: false,
            message: 'Server error'
        });

    }

};

// ============================================
// VERIFY TOKEN
// ============================================
const verifyToken = async (req, res) => {

    return res.status(200).json({
        success: true,
        message: 'Token is valid',
        data: req.user
    });

};

// ============================================
// EXPORT
// ============================================
module.exports = {
    login,
    verifyToken
};