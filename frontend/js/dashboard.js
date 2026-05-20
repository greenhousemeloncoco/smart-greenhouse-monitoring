// dashboard.js - Smart Greenhouse Monitoring System
'use strict';

// ============================================
// Config & State
// ============================================
const API_BASE    = '/api';
const REFRESH_MS  = 5000;
let token         = localStorage.getItem('gh_token') || 'demo_token_greenhouse';
let refreshTimer  = null;
let chartRange    = 20;
let historyPage   = 1;
let chartTH       = null;
let chartPT       = null;

// Demo data generator
const demoMode = () => !token || token === 'demo_token_greenhouse' || token.startsWith('demo');

function genDemoData() {
    const base = {
        temperature: +(24 + Math.random() * 12).toFixed(1),
        humidity:    +(55 + Math.random() * 25).toFixed(1),
        ph_level:    +(5.8 + Math.random() * 2.0).toFixed(2),
        tds_value:   +(900 + Math.random() * 800).toFixed(0),
        device_name: 'ESP32-GH-001',
        device_status: 'online',
        last_seen: new Date().toISOString(),
        recorded_at: new Date().toISOString()
    };
    base.temp_status     = getStatus(base.temperature, 'temperature');
    base.humidity_status = getStatus(base.humidity, 'humidity');
    base.ph_status       = getStatus(base.ph_level, 'ph');
    base.tds_status      = getStatus(base.tds_value, 'tds');
    const ss = [base.temp_status, base.humidity_status, base.ph_status, base.tds_status];
    base.overall_status = ss.includes('danger') ? 'danger' : ss.includes('warning') ? 'warning' : 'normal';
    return base;
}

function getStatus(value, type) {
    const t = {
        temperature: { wMin: 20, wMax: 35, dMin: 15, dMax: 40 },
        humidity:    { wMin: 50, wMax: 80, dMin: 30, dMax: 95 },
        ph:          { wMin: 5.5, wMax: 7.5, dMin: 4.0, dMax: 9.0 },
        tds:         { wMin: 800, wMax: 1800, dMin: 500, dMax: 2500 }
    }[type];
    if (!t) return 'normal';
    if (value < t.dMin || value > t.dMax) return 'danger';
    if (value < t.wMin || value > t.wMax) return 'warning';
    return 'normal';
}

// ============================================
// Auth Check
// ============================================
(function checkAuth() {
    const user = JSON.parse(localStorage.getItem('gh_user') || '{}');
    if (!token) { window.location.href = '/'; return; }
    document.getElementById('topbarUser').textContent = user.full_name || user.username || 'Admin';
})();

// ============================================
// Clock
// ============================================
function startClock() {
    function tick() {
        const now = new Date();
        document.getElementById('topbarTime').textContent =
            now.toLocaleTimeString('id-ID', { hour12: false });
        document.getElementById('topbarDate').textContent =
            now.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
    }
    tick();
    setInterval(tick, 1000);
}

// ============================================
// API Fetch Helper
// ============================================
async function apiFetch(endpoint) {
    const res = await fetch(API_BASE + endpoint, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });
    if (!res.ok) throw new Error('API error: ' + res.status);
    return res.json();
}

// ============================================
// Update Sensor Cards
// ============================================
function updateCards(data) {
    if (!data) return;

    const fields = [
        { key: 'temperature', id: 'temp', max: 50 },
        { key: 'humidity',    id: 'hum',  max: 100 },
        { key: 'ph_level',    id: 'ph',   max: 14 },
        { key: 'tds_value',   id: 'tds',  max: 3000 }
    ];

    fields.forEach(({ key, id, max }) => {
        const val    = parseFloat(data[key]) || 0;
        const status = data[`${id === 'hum' ? 'humidity' : id === 'ph' ? 'ph' : id}_status`]
            || data[`${key.replace('_level','').replace('_value','')}_status`]
            || 'normal';

        // Determine correct status key
        let sKey;
        if (id === 'temp') sKey = 'temp_status';
        else if (id === 'hum') sKey = 'humidity_status';
        else if (id === 'ph') sKey = 'ph_status';
        else sKey = 'tds_status';
        const st = data[sKey] || 'normal';

        // Number
        const numEl = document.getElementById(`num-${id}`);
        if (numEl) numEl.textContent = val % 1 === 0 ? val : val.toFixed(id === 'ph' ? 2 : 1);

        // Badge
        const badge = document.getElementById(`badge-${id}`);
        if (badge) {
            badge.className = `card-badge ${st}`;
            badge.textContent = st.toUpperCase();
        }

        // Card border
        const card = document.getElementById(`card-${id}`);
        if (card) {
            card.className = `sensor-card ${st !== 'normal' ? st : ''}`;
        }

        // Gauge
        const gauge = document.getElementById(`gauge-${id}`);
        if (gauge) {
            gauge.style.width = Math.min(100, (val / max) * 100) + '%';
        }

        // Val color
        if (numEl) {
            numEl.style.color = st === 'danger' ? 'var(--red)' : st === 'warning' ? 'var(--yellow)' : 'var(--text)';
        }

        // Sidebar badge
        const sbId = id === 'hum' ? 'sb-hum' : `sb-${id}`;
        const sbEl = document.getElementById(sbId);
        if (sbEl) {
            sbEl.className = `sensor-badge ${st}`;
            sbEl.textContent = st.toUpperCase();
        }
    });

    // Overall status banner
    updateBanner(data.overall_status);

    // Device status
    const devDot  = document.getElementById('devDotSb');
    const devLast = document.getElementById('devLastSb');
    const devStat = data.device_status || 'offline';
    if (devDot)  devDot.className  = `dev-dot ${devStat}`;
    if (devLast) devLast.textContent = data.last_seen
        ? new Date(data.last_seen).toLocaleTimeString('id-ID')
        : '--';

    // Last update
    document.getElementById('lastUpdate').textContent =
        'Data terakhir: ' + (data.recorded_at
            ? new Date(data.recorded_at).toLocaleString('id-ID')
            : new Date().toLocaleString('id-ID'));
}

function updateBanner(status) {
    const banner = document.getElementById('statusBanner');
    const icon   = document.getElementById('bannerIcon');
    const title  = document.getElementById('bannerTitle');
    const sub    = document.getElementById('bannerSub');
    if (!banner) return;

    const configs = {
        normal:  { cls: '',        icon: 'fa-check-circle',       title: 'STATUS GREENHOUSE: NORMAL',   sub: 'Semua parameter dalam kondisi optimal' },
        warning: { cls: 'warning', icon: 'fa-exclamation-triangle', title: 'PERINGATAN: KONDISI WASPADA', sub: 'Beberapa parameter mendekati batas kritis' },
        danger:  { cls: 'danger',  icon: 'fa-exclamation-circle',  title: 'BAHAYA: KONDISI KRITIS!',     sub: 'Segera periksa kondisi greenhouse!' }
    };
    const c = configs[status] || configs.normal;
    banner.className = `status-banner ${c.cls}`;
    icon.innerHTML   = `<i class="fas ${c.icon}"></i>`;
    title.textContent = c.title;
    sub.textContent   = c.sub;
}

// ============================================
// Charts
// ============================================
const chartDefaults = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 300 },
    plugins: {
        legend: {
            labels: { color: 'rgba(180,220,190,0.6)', font: { family: 'Rajdhani', size: 12 }, boxWidth: 12 }
        },
        tooltip: {
            backgroundColor: 'rgba(8,20,8,0.95)',
            borderColor: 'rgba(0,255,136,0.3)',
            borderWidth: 1,
            titleColor: '#00ff88',
            bodyColor: '#d4f5dc'
        }
    },
    scales: {
        x: {
            ticks: { color: 'rgba(180,220,190,0.4)', maxRotation: 0, maxTicksLimit: 6, font: { size: 10 } },
            grid:  { color: 'rgba(0,255,136,0.04)' },
            border: { display: false }
        },
        y: {
            ticks: { color: 'rgba(180,220,190,0.4)', font: { size: 10 } },
            grid:  { color: 'rgba(0,255,136,0.05)' },
            border: { display: false }
        }
    }
};

function initCharts() {
    const ctxTH = document.getElementById('chartTempHum').getContext('2d');
    chartTH = new Chart(ctxTH, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Suhu (°C)',
                    data: [], borderColor: '#ff7744', backgroundColor: 'rgba(255,119,68,0.1)',
                    tension: 0.4, fill: true, pointRadius: 2, borderWidth: 2
                },
                {
                    label: 'Kelembapan (%)',
                    data: [], borderColor: '#44aaff', backgroundColor: 'rgba(68,170,255,0.08)',
                    tension: 0.4, fill: true, pointRadius: 2, borderWidth: 2
                }
            ]
        },
        options: { ...chartDefaults }
    });

    const ctxPT = document.getElementById('chartPhTds').getContext('2d');
    chartPT = new Chart(ctxPT, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'pH',
                    data: [], borderColor: '#aa44ff', backgroundColor: 'rgba(170,68,255,0.08)',
                    tension: 0.4, fill: true, pointRadius: 2, borderWidth: 2,
                    yAxisID: 'yPh'
                },
                {
                    label: 'TDS (ppm)',
                    data: [], borderColor: '#00ccff', backgroundColor: 'rgba(0,204,255,0.08)',
                    tension: 0.4, fill: true, pointRadius: 2, borderWidth: 2,
                    yAxisID: 'yTds'
                }
            ]
        },
        options: {
            ...chartDefaults,
            scales: {
                ...chartDefaults.scales,
                yPh: {
                    type: 'linear', position: 'left',
                    ticks: { color: 'rgba(180,220,190,0.4)', font: { size: 10 } },
                    grid: { color: 'rgba(0,255,136,0.05)' }
                },
                yTds: {
                    type: 'linear', position: 'right',
                    ticks: { color: 'rgba(180,220,190,0.4)', font: { size: 10 } },
                    grid: { drawOnChartArea: false }
                }
            }
        }
    });
}

function updateCharts(chartData) {
    if (!chartData) return;
    const labels = chartData.labels.map(l => new Date(l).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));

    chartTH.data.labels            = labels;
    chartTH.data.datasets[0].data  = chartData.temperature;
    chartTH.data.datasets[1].data  = chartData.humidity;
    chartTH.update();

    chartPT.data.labels            = labels;
    chartPT.data.datasets[0].data  = chartData.ph;
    chartPT.data.datasets[1].data  = chartData.tds;
    chartPT.update();
}

// Demo chart data store
let demoHistory = [];
function getDemoChartData(limit) {
    // Generate history if needed
    while (demoHistory.length < limit) {
        const d = genDemoData();
        d.recorded_at = new Date(Date.now() - (limit - demoHistory.length) * 15000).toISOString();
        demoHistory.unshift(d);
    }
    if (demoHistory.length > 200) demoHistory = demoHistory.slice(-200);
    const slice = demoHistory.slice(-limit);
    return {
        labels:      slice.map(d => d.recorded_at),
        temperature: slice.map(d => d.temperature),
        humidity:    slice.map(d => d.humidity),
        ph:          slice.map(d => d.ph_level),
        tds:         slice.map(d => d.tds_value)
    };
}

// ============================================
// History Table
// ============================================
function renderHistory(rows) {
    const tbody = document.getElementById('historyBody');
    if (!rows || rows.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="table-loading">Belum ada data</td></tr>';
        return;
    }
    tbody.innerHTML = rows.map((r, i) => `
        <tr>
            <td style="color:var(--text-dim)">${i + 1}</td>
            <td style="color:#ff7744;font-weight:600">${(+r.temperature).toFixed(1)}°</td>
            <td style="color:#44aaff;font-weight:600">${(+r.humidity).toFixed(1)}%</td>
            <td style="color:#aa44ff;font-weight:600">${(+r.ph_level).toFixed(2)}</td>
            <td style="color:#00ccff;font-weight:600">${Math.round(+r.tds_value)}</td>
            <td><span class="pill ${r.overall_status || 'normal'}">${(r.overall_status || 'NORMAL').toUpperCase()}</span></td>
            <td style="color:var(--text-muted);font-size:0.75rem">${new Date(r.recorded_at).toLocaleString('id-ID')}</td>
        </tr>
    `).join('');
}

// ============================================
// Main Data Fetch
// ============================================
async function fetchData() {
    const refreshBtn  = document.getElementById('refreshBtn');
    const refreshIcon = document.getElementById('refreshIcon');
    refreshBtn.classList.add('spinning');

    try {
        if (demoMode()) {
            // Demo mode
            const latest = genDemoData();
            demoHistory.push(latest);
            if (demoHistory.length > 200) demoHistory.shift();

            updateCards(latest);
            updateCharts(getDemoChartData(chartRange));
            renderHistory([...demoHistory].reverse().slice(0, 20));
        } else {
            // Real API
            const [latestRes, chartRes, historyRes] = await Promise.all([
                apiFetch('/sensor/latest'),
                apiFetch(`/sensor/chart?limit=${chartRange}`),
                apiFetch('/sensor/history?page=1&limit=20')
            ]);
            if (latestRes.success) updateCards(latestRes.data);
            if (chartRes.success)  updateCharts(chartRes.data);
            if (historyRes.success) renderHistory(historyRes.data);
        }
    } catch (err) {
        console.warn('Fetch error, using demo data:', err.message);
        const latest = genDemoData();
        demoHistory.push(latest);
        if (demoHistory.length > 200) demoHistory.shift();
        updateCards(latest);
        updateCharts(getDemoChartData(chartRange));
        renderHistory([...demoHistory].reverse().slice(0, 20));
    } finally {
        refreshBtn.classList.remove('spinning');
    }
}

// ============================================
// CSV Export
// ============================================
function exportCSV() {
    const rows = demoMode() ? demoHistory.slice(-50) : [];
    if (!rows.length) { alert('Tidak ada data untuk diekspor.'); return; }

    const headers = ['Waktu', 'Suhu (°C)', 'Kelembapan (%)', 'pH', 'TDS (ppm)', 'Status'];
    const csvRows = [
        headers.join(','),
        ...rows.map(r => [
            new Date(r.recorded_at).toLocaleString('id-ID'),
            r.temperature, r.humidity, r.ph_level, r.tds_value, r.overall_status
        ].join(','))
    ];

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `greenhouse_data_${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
}

// ============================================
// Event Listeners
// ============================================
function bindEvents() {
    // Sidebar toggle (mobile)
    document.getElementById('menuToggle').addEventListener('click', () => {
        document.getElementById('sidebar').classList.add('open');
        document.getElementById('sidebarOverlay').classList.add('active');
    });
    document.getElementById('sidebarClose').addEventListener('click', closeSidebar);
    document.getElementById('sidebarOverlay').addEventListener('click', closeSidebar);
    function closeSidebar() {
        document.getElementById('sidebar').classList.remove('open');
        document.getElementById('sidebarOverlay').classList.remove('active');
    }

    // Refresh button
    document.getElementById('refreshBtn').addEventListener('click', fetchData);

    // Chart range
    document.querySelectorAll('.chart-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.chart-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            chartRange = parseInt(this.dataset.range);
            fetchData();
        });
    });

    // Export
    document.getElementById('exportBtn').addEventListener('click', exportCSV);

    // Load More
    document.getElementById('loadMoreBtn').addEventListener('click', () => {
        historyPage++;
        // In real app: fetch more
        alert('Fitur ini memerlukan koneksi ke backend. Halaman: ' + historyPage);
    });

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', () => {
        if (confirm('Yakin ingin keluar?')) {
            localStorage.removeItem('gh_token');
            localStorage.removeItem('gh_user');
            window.location.href = '/';
        }
    });
}

// ============================================
// Init
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    startClock();
    initCharts();
    bindEvents();
    fetchData(); // initial load
    refreshTimer = setInterval(fetchData, REFRESH_MS);
});

window.addEventListener('beforeunload', () => {
    if (refreshTimer) clearInterval(refreshTimer);
});