// server.js - Smart Greenhouse Monitoring System
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
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
// Static Files (Frontend)
// ============================================
app.use(express.static(path.join(__dirname, '../frontend')));

// ============================================
// API Routes
// ============================================
app.use('/api', require('./routes/api'));

// ============================================
// Frontend Routes
// ============================================
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages/login.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages/dashboard.html'));
});

// ============================================
// 404 Handler
// ============================================
app.use((req, res) => {
    if (req.path.startsWith('/api')) {
        return res.status(404).json({ success: false, message: 'API endpoint not found' });
    }
    res.redirect('/');
});

// ============================================
// Error Handler
// ============================================
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ success: false, message: 'Internal server error' });
});

// ============================================
// Start Server
// ============================================
app.listen(PORT, () => {
    console.log('');
    console.log('🌿 ============================================');
    console.log('🌿  Smart Greenhouse Monitoring System');
    console.log('🌿 ============================================');
    console.log(`🚀  Server running on http://localhost:${PORT}`);
    console.log(`📡  API Base URL: http://localhost:${PORT}/api`);
    console.log(`🌍  Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log('🌿 ============================================');
    console.log('');
});

module.exports = app;