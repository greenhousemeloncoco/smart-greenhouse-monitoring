// middleware/auth.js
const jwt = require('jsonwebtoken');
require('dotenv').config();

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Access token required'
        });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({
                success: false,
                message: 'Invalid or expired token'
            });
        }
        req.user = user;
        next();
    });
};

const authenticateDevice = async (req, res, next) => {
    const apiKey = req.headers['x-api-key'] || req.body.api_key || req.query.api_key;
    if (!apiKey) {
        return res.status(401).json({
            success: false,
            message: 'API key required'
        });
    }

    const db = require('../config/database');
    try {
        const [rows] = await db.execute(
            'SELECT * FROM devices WHERE api_key = ?',
            [apiKey]
        );
        if (rows.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'Invalid API key'
            });
        }
        req.device = rows[0];
        next();
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

module.exports = { authenticateToken, authenticateDevice };