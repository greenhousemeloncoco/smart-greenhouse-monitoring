// server.js - Smart Greenhouse Monitoring System
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// Middleware
// ============================================
app.use(helmet({ contentSecurityPolicy: false }));

app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key']
}));

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================
// API Routes
// ============================================
app.use('/api', require('./routes/api'));

// ============================================
// Root Route
// ============================================
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Smart Greenhouse Backend Running'
    });
});

// ============================================
// 404 Handler
// ============================================
app.use((req, res) => {
    if (req.path.startsWith('/api')) {
        return res.status(404).json({
            success: false,
            message: 'API endpoint not found'
        });
    }

    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// ============================================
// Error Handler
// ============================================
app.use((err, req, res, next) => {
    console.error('Server error:', err);

    res.status(500).json({
        success: false,
        message: 'Internal server error'
    });
});

// ============================================
// Start Server
// ============================================
app.listen(PORT, () => {
    console.log('');
    console.log('🌿 ============================================');
    console.log('🌿 Smart Greenhouse Monitoring System');
    console.log('🌿 ============================================');
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 API Base URL: /api`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log('🌿 ============================================');
    console.log('');
});

module.exports = app;