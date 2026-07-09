const express = require('express');
const cors = require('cors');
const path = require('path');
const os = require('os');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

// Serve static files from current directory
app.use(express.static(__dirname));

// Helper to get local IP address in the network
function getLocalIPAddress() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1';
}

// Fallback to serve index.html for spa routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  const localIP = getLocalIPAddress();
  console.log(`==================================================`);
  console.log(`RKV PDF Web Server running successfully!`);
  console.log(`- Local URL:        http://localhost:${PORT}`);
  console.log(`- Local network IP: http://${localIP}:${PORT}`);
  console.log(`==================================================`);
});
