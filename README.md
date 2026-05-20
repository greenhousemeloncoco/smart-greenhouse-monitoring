# 🌿 Smart Greenhouse Monitoring System

**Sistem monitoring greenhouse berbasis IoT menggunakan ESP32, Node.js, MySQL, dan dashboard web modern.**

---

## 📁 Struktur Folder

```
greenhouse/
├── backend/
│   ├── config/
│   │   └── database.js          # Koneksi MySQL
│   ├── controllers/
│   │   ├── authController.js    # Login & JWT
│   │   └── sensorController.js  # CRUD sensor data
│   ├── middleware/
│   │   └── auth.js              # JWT & API Key auth
│   ├── routes/
│   │   └── api.js               # API routes
│   ├── server.js                # Main Express server
│   ├── package.json
│   └── .env.example             # Environment template
│
├── frontend/
│   ├── pages/
│   │   ├── login.html           # Halaman login admin
│   │   └── dashboard.html       # Dashboard monitoring
│   ├── css/
│   │   ├── login.css
│   │   └── dashboard.css
│   └── js/
│       └── dashboard.js         # Logika realtime
│
├── database/
│   └── schema.sql               # Skema & data awal MySQL
│
└── ESP32_Firmware.ino           # Kode Arduino ESP32
```

---

## 🚀 Cara Menjalankan

### 1. Setup Database MySQL

```sql
mysql -u root -p < database/schema.sql
```

### 2. Setup Backend

```bash
cd backend
cp .env.example .env
# Edit .env dengan konfigurasi database Anda

npm install
npm start
```

Server berjalan di: `http://localhost:3000`

### 3. Buka Dashboard

Browser: `http://localhost:3000`
- **Username:** `admin`
- **Password:** `admin123`

---

## 📡 API Endpoints

| Method | Endpoint              | Auth       | Deskripsi                    |
|--------|-----------------------|------------|------------------------------|
| POST   | `/api/auth/login`     | Public     | Login admin                  |
| GET    | `/api/auth/verify`    | JWT        | Verifikasi token              |
| POST   | `/api/sensor/data`    | API Key    | Kirim data dari ESP32        |
| GET    | `/api/sensor/latest`  | JWT        | Data sensor terbaru          |
| GET    | `/api/sensor/history` | JWT        | Riwayat data (pagination)    |
| GET    | `/api/sensor/chart`   | JWT        | Data untuk grafik             |
| GET    | `/api/sensor/stats`   | JWT        | Statistik 24 jam             |
| GET    | `/api/devices`        | JWT        | Daftar perangkat ESP32       |
| GET    | `/api/health`         | Public     | Status server                |

### Contoh Request ESP32:
```http
POST /api/sensor/data
x-api-key: gh_apikey_esp32_secret_2024_xyz
Content-Type: application/json

{
  "temperature": 26.5,
  "humidity": 68.2,
  "ph_level": 6.8,
  "tds_value": 1250
}
```

---

## 🌡️ Sensor Thresholds

| Sensor      | Normal          | Warning          | Bahaya          |
|-------------|-----------------|------------------|-----------------|
| Suhu        | 20–35°C         | 15–20 / 35–40°C  | <15 / >40°C     |
| Kelembapan  | 50–80%          | 30–50 / 80–95%   | <30 / >95%      |
| pH Air      | 5.5–7.5         | 4.0–5.5 / 7.5–9  | <4.0 / >9.0     |
| TDS         | 800–1800 ppm    | 500–800 / 1800–2500 | <500 / >2500 |

---

## 🔌 Wiring ESP32

```
DHT22:      VCC→3.3V | DATA→GPIO4 (10kΩ pull-up) | GND→GND
pH Sensor:  VCC→5V | OUT→GPIO34 (voltage divider!) | GND→GND
TDS Sensor: VCC→3.3V | OUT→GPIO35 | GND→GND
```

---

## 🛠️ Tech Stack

- **Mikrokontroler:** ESP32
- **Sensor:** DHT22, pH Sensor, TDS Sensor
- **Backend:** Node.js + Express.js
- **Database:** MySQL
- **Frontend:** HTML, CSS, Bootstrap, JavaScript
- **Charts:** Chart.js
- **Auth:** JWT + bcrypt
- **Icons:** Font Awesome

---

## 🎨 Fitur Dashboard

- ✅ Login admin dengan JWT
- ✅ Dark mode futuristic UI
- ✅ 4 kartu monitoring sensor realtime
- ✅ Status NORMAL / WARNING / BAHAYA
- ✅ Grafik realtime Chart.js
- ✅ Tabel riwayat data
- ✅ Status koneksi ESP32
- ✅ Export CSV
- ✅ Sidebar & navbar responsif
- ✅ Auto-refresh setiap 5 detik
- ✅ Demo mode (tanpa backend)

---

*Smart Greenhouse Monitoring System v1.0.0*