// routes/api.js
const express = require('express');
const router = express.Router();
const { login, verifyToken } = require('../controllers/authController');
const {
    receiveData, getLatest, getHistory,
    getChartData, getStats, getDevices
} = require('../controllers/sensorController');
const { authenticateToken, authenticateDevice } = require('../middleware/auth');

// ============================================
// Auth Routes
// ============================================
router.post('/auth/login', login);
router.get('/auth/verify', authenticateToken, verifyToken);

// ============================================
// ESP32 Device Routes (API Key Auth)
// ============================================
router.post('/sensor/data', authenticateDevice, receiveData);

// ============================================
// Dashboard Routes (JWT Auth)
// ============================================
router.get('/sensor/latest',  authenticateToken, getLatest);
router.get('/sensor/history', authenticateToken, getHistory);
router.get('/sensor/chart',   authenticateToken, getChartData);
router.get('/sensor/stats',   authenticateToken, getStats);
router.get('/devices',        authenticateToken, getDevices);

// ============================================
// Health Check
// ============================================
router.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Smart Greenhouse API is running',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

module.exports = router;