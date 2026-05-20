// controllers/sensorController.js
const db = require('../config/database');

// Determine status based on thresholds
const getStatus = (value, type) => {
    const thresholds = {
        temperature: { warning_min: 20, warning_max: 35, danger_min: 15, danger_max: 40 },
        humidity:    { warning_min: 50, warning_max: 80, danger_min: 30, danger_max: 95 },
        ph:          { warning_min: 5.5, warning_max: 7.5, danger_min: 4.0, danger_max: 9.0 },
        tds:         { warning_min: 800, warning_max: 1800, danger_min: 500, danger_max: 2500 }
    };

    const t = thresholds[type];
    if (!t) return 'normal';

    if (value < t.danger_min || value > t.danger_max) return 'danger';
    if (value < t.warning_min || value > t.warning_max) return 'warning';
    return 'normal';
};

// POST /api/sensor/data  - Receive data from ESP32
const receiveData = async (req, res) => {
    const { temperature, humidity, ph_level, tds_value } = req.body;
    const device = req.device;

    if (temperature === undefined || humidity === undefined || ph_level === undefined || tds_value === undefined) {
        return res.status(400).json({
            success: false,
            message: 'Missing sensor values: temperature, humidity, ph_level, tds_value required'
        });
    }

    const temp_status     = getStatus(parseFloat(temperature), 'temperature');
    const humidity_status = getStatus(parseFloat(humidity), 'humidity');
    const ph_status       = getStatus(parseFloat(ph_level), 'ph');
    const tds_status      = getStatus(parseFloat(tds_value), 'tds');

    const statuses = [temp_status, humidity_status, ph_status, tds_status];
    const overall_status = statuses.includes('danger') ? 'danger'
        : statuses.includes('warning') ? 'warning' : 'normal';

    try {
        // Update device status
        await db.execute(
            'UPDATE devices SET status = ?, last_seen = NOW() WHERE device_id = ?',
            ['online', device.device_id]
        );

        // Insert sensor data
        const [result] = await db.execute(
            `INSERT INTO sensor_data 
             (device_id, temperature, humidity, ph_level, tds_value, temp_status, humidity_status, ph_status, tds_status, overall_status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [device.device_id, temperature, humidity, ph_level, tds_value,
             temp_status, humidity_status, ph_status, tds_status, overall_status]
        );

        res.json({
            success: true,
            message: 'Data received successfully',
            data: {
                id: result.insertId,
                overall_status,
                temp_status, humidity_status, ph_status, tds_status
            }
        });
    } catch (error) {
        console.error('Receive data error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// GET /api/sensor/latest - Get latest sensor reading
const getLatest = async (req, res) => {
    try {
        const [rows] = await db.execute(
            `SELECT sd.*, d.device_name, d.status as device_status, d.last_seen
             FROM sensor_data sd
             JOIN devices d ON sd.device_id = d.device_id
             ORDER BY sd.recorded_at DESC LIMIT 1`
        );

        if (rows.length === 0) {
            return res.json({ success: true, data: null });
        }

        res.json({ success: true, data: rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// GET /api/sensor/history - Get history with pagination
const getHistory = async (req, res) => {
    const page   = parseInt(req.query.page) || 1;
    const limit  = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const device_id = req.query.device_id || null;
    const from   = req.query.from || null;
    const to     = req.query.to || null;

    let whereClause = '';
    let params = [];

    if (device_id) { whereClause += ' AND sd.device_id = ?'; params.push(device_id); }
    if (from)      { whereClause += ' AND sd.recorded_at >= ?'; params.push(from); }
    if (to)        { whereClause += ' AND sd.recorded_at <= ?'; params.push(to); }

    try {
        const [rows] = await db.execute(
            `SELECT sd.*, d.device_name FROM sensor_data sd
             JOIN devices d ON sd.device_id = d.device_id
             WHERE 1=1 ${whereClause}
             ORDER BY sd.recorded_at DESC LIMIT ${limit} OFFSET ${offset}`,
            params
        );

        const [countRows] = await db.execute(
            `SELECT COUNT(*) as total FROM sensor_data sd WHERE 1=1 ${whereClause}`,
            params
        );

        res.json({
            success: true,
            data: rows,
            pagination: {
                page, limit,
                total: countRows[0].total,
                totalPages: Math.ceil(countRows[0].total / limit)
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// GET /api/sensor/chart - Get chart data (last N records)
const getChartData = async (req, res) => {
    const limit = parseInt(req.query.limit) || 20;
    const device_id = req.query.device_id || null;

    let whereClause = '';
    let params = [];
    if (device_id) { whereClause += ' WHERE device_id = ?'; params.push(device_id); }

    try {
        const [rows] = await db.execute(
            `SELECT temperature, humidity, ph_level, tds_value, recorded_at
             FROM sensor_data ${whereClause}
             ORDER BY recorded_at DESC LIMIT ${limit}`,
            params
        );

        const sorted = rows.reverse();
        res.json({
            success: true,
            data: {
                labels:      sorted.map(r => r.recorded_at),
                temperature: sorted.map(r => r.temperature),
                humidity:    sorted.map(r => r.humidity),
                ph:          sorted.map(r => r.ph_level),
                tds:         sorted.map(r => r.tds_value)
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// GET /api/sensor/stats - Summary stats
const getStats = async (req, res) => {
    try {
        const [rows] = await db.execute(
            `SELECT 
                COUNT(*) as total_readings,
                AVG(temperature) as avg_temp,
                AVG(humidity) as avg_humidity,
                AVG(ph_level) as avg_ph,
                AVG(tds_value) as avg_tds,
                MAX(temperature) as max_temp,
                MIN(temperature) as min_temp,
                SUM(CASE WHEN overall_status = 'danger' THEN 1 ELSE 0 END) as danger_count,
                SUM(CASE WHEN overall_status = 'warning' THEN 1 ELSE 0 END) as warning_count
             FROM sensor_data
             WHERE recorded_at >= NOW() - INTERVAL 24 HOUR`
        );

        res.json({ success: true, data: rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// GET /api/devices - Get all devices
const getDevices = async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT id, device_id, device_name, location, status, last_seen, created_at FROM devices');
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

module.exports = { receiveData, getLatest, getHistory, getChartData, getStats, getDevices };