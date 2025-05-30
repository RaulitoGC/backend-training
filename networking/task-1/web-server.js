// web-server.js
const express = require('express');
const os = require('os');
const app = express();
const port = 8080;

const connectedDevices = [];

app.use(express.static('public')); // Serve HTML/JS from 'public' folder
app.use(express.json());

app.post('/register', (req, res) => {
    const device = {
        name: req.body.name || 'Unknown',
        ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
        timestamp: new Date(),
    };
    connectedDevices.push(device);
    console.log('New device registered:', device);
    res.json({ success: true });
});

app.get('/list', (req, res) => {
    res.json(connectedDevices);
});

app.listen(port, () => {
    console.log(`Web server running at http://${getLocalIP()}:${port}`);
});

// Helper to get local LAN IP
function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const iface of Object.values(interfaces)) {
        for (const config of iface) {
            if (config.family === 'IPv4' && !config.internal) {
                return config.address;
            }
        }
    }
}
