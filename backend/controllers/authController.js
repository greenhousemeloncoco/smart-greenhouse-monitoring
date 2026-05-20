// controllers/authController.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
require('dotenv').config();

const login = async (req, res) => {
    const { username, password } = req.body;

    // DEBUG LOGIN
    console.log('================ LOGIN DEBUG ================');
    console.log('Request Body:', req.body);
    console.log('Username Input:', username);
    console.log('Password Input:', password);

    if (!username || !password) {
        return res.status(400).json({
            success: false,
            message: 'Username and password are required'
        });
    }

    try {
        const [rows] = await db.execute(
            'SELECT * FROM admins WHERE username = ?',
            [username]
        );

        console.log('Database Result:', rows);

        if (rows.length === 0) {
            console.log('Username not found');
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        const admin = rows[0];

        console.log('Stored Hash:', admin.password);

        const passwordMatch = await bcrypt.compare(password, admin.password);

        console.log('Password Match:', passwordMatch);

        if (!passwordMatch) {
            console.log('Password does not match');
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        const token = jwt.sign(
            { id: admin.id, username: admin.username },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
        );

        console.log('Login Success');
        console.log('============================================');

        res.json({
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
        console.error('Login error:', error);

        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

const verifyToken = (req, res) => {
    res.json({
        success: true,
        message: 'Token is valid',
        data: { user: req.user }
    });
};

module.exports = { login, verifyToken };