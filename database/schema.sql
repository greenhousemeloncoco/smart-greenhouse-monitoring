-- ============================================
-- Smart Greenhouse Monitoring System
-- Database Schema
-- ============================================

CREATE DATABASE IF NOT EXISTS greenhouse_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE greenhouse_db;

-- ============================================
-- Table: admins
-- ============================================
CREATE TABLE IF NOT EXISTS admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    email VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================
-- Table: devices (ESP32 devices)
-- ============================================
CREATE TABLE IF NOT EXISTS devices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    device_id VARCHAR(50) NOT NULL UNIQUE,
    device_name VARCHAR(100),
    location VARCHAR(100),
    api_key VARCHAR(64) NOT NULL UNIQUE,
    status ENUM('online', 'offline') DEFAULT 'offline',
    last_seen TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- Table: sensor_data
-- ============================================
CREATE TABLE IF NOT EXISTS sensor_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    device_id VARCHAR(50) NOT NULL,
    temperature DECIMAL(5,2),
    humidity DECIMAL(5,2),
    ph_level DECIMAL(4,2),
    tds_value DECIMAL(7,2),
    temp_status ENUM('normal', 'warning', 'danger') DEFAULT 'normal',
    humidity_status ENUM('normal', 'warning', 'danger') DEFAULT 'normal',
    ph_status ENUM('normal', 'warning', 'danger') DEFAULT 'normal',
    tds_status ENUM('normal', 'warning', 'danger') DEFAULT 'normal',
    overall_status ENUM('normal', 'warning', 'danger') DEFAULT 'normal',
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_device_id (device_id),
    INDEX idx_recorded_at (recorded_at),
    FOREIGN KEY (device_id) REFERENCES devices(device_id) ON DELETE CASCADE
);

-- ============================================
-- Table: sensor_thresholds
-- ============================================
CREATE TABLE IF NOT EXISTS sensor_thresholds (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sensor_type ENUM('temperature', 'humidity', 'ph', 'tds') NOT NULL,
    warning_min DECIMAL(7,2),
    warning_max DECIMAL(7,2),
    danger_min DECIMAL(7,2),
    danger_max DECIMAL(7,2),
    unit VARCHAR(20),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================
-- Default Admin (password: admin123)
-- ============================================
INSERT INTO admins (username, password, full_name, email) VALUES
('admin', '$2b$10$rOzJqsXKj1q.VjqDfGlQ7OdO7Q.6P/qHHG6Mk.5K1Y7s3Z9gZhH8i', 'Administrator', 'admin@greenhouse.com')
ON DUPLICATE KEY UPDATE username=username;

-- ============================================
-- Default Device
-- ============================================
INSERT INTO devices (device_id, device_name, location, api_key, status) VALUES
('ESP32-GH-001', 'ESP32 Greenhouse Unit 1', 'Greenhouse A - Zone 1', 'gh_apikey_esp32_secret_2024_xyz', 'offline')
ON DUPLICATE KEY UPDATE device_id=device_id;

-- ============================================
-- Default Thresholds
-- ============================================
INSERT INTO sensor_thresholds (sensor_type, warning_min, warning_max, danger_min, danger_max, unit) VALUES
('temperature', 20.0, 35.0, 15.0, 40.0, '°C'),
('humidity', 50.0, 80.0, 30.0, 95.0, '%'),
('ph', 5.5, 7.5, 4.0, 9.0, 'pH'),
('tds', 800.0, 1800.0, 500.0, 2500.0, 'ppm')
ON DUPLICATE KEY UPDATE sensor_type=sensor_type;

-- ============================================
-- Sample sensor data for testing
-- ============================================
INSERT INTO sensor_data (device_id, temperature, humidity, ph_level, tds_value, temp_status, humidity_status, ph_status, tds_status, overall_status, recorded_at) VALUES
('ESP32-GH-001', 26.5, 68.2, 6.8, 1250.5, 'normal', 'normal', 'normal', 'normal', 'normal', NOW() - INTERVAL 60 MINUTE),
('ESP32-GH-001', 27.1, 67.5, 6.9, 1265.0, 'normal', 'normal', 'normal', 'normal', 'normal', NOW() - INTERVAL 50 MINUTE),
('ESP32-GH-001', 28.3, 70.1, 6.7, 1280.3, 'normal', 'normal', 'normal', 'normal', 'normal', NOW() - INTERVAL 40 MINUTE),
('ESP32-GH-001', 29.0, 72.5, 6.5, 1310.0, 'normal', 'normal', 'normal', 'normal', 'normal', NOW() - INTERVAL 30 MINUTE),
('ESP32-GH-001', 31.5, 75.0, 6.3, 1340.8, 'normal', 'normal', 'normal', 'normal', 'normal', NOW() - INTERVAL 20 MINUTE),
('ESP32-GH-001', 33.2, 78.3, 6.2, 1380.2, 'warning', 'normal', 'normal', 'normal', 'warning', NOW() - INTERVAL 10 MINUTE),
('ESP32-GH-001', 27.8, 69.4, 6.8, 1290.6, 'normal', 'normal', 'normal', 'normal', 'normal', NOW() - INTERVAL 5 MINUTE),
('ESP32-GH-001', 26.9, 68.8, 6.7, 1275.1, 'normal', 'normal', 'normal', 'normal', 'normal', NOW());