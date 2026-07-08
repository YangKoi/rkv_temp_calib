const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const os = require('os');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_KEY = '7179';

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Ensure static files are served from root directory
app.use(express.static(__dirname));

const DB_FILE = path.join(__dirname, 'db_certificates.json');

// Ensure db_certificates.json exists
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify([]));
}

// Helper to get local IP address in the network
function getLocalIPAddress() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Look for IPv4 addresses that are not internal (like loopback 127.0.0.1)
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1';
}

// Middleware to verify Admin Key
const requireAdmin = (req, res, next) => {
  const adminKey = req.headers['x-admin-key'];
  if (adminKey === ADMIN_KEY) {
    next();
  } else {
    res.status(401).json({ success: false, error: 'Unauthorized. Admin access required.' });
  }
};

// API: Save new certificate (Admin only)
app.post('/api/certificates', requireAdmin, (req, res) => {
  try {
    const certData = req.body;
    if (!certData) {
      return res.status(400).json({ success: false, error: 'Invalid certificate data.' });
    }

    // Generate unique ID
    const certId = `RKV-${Date.now()}`;
    const newCertificate = {
      id: certId,
      createdAt: new Date().toISOString(),
      ...certData
    };

    // Read existing
    const fileData = fs.readFileSync(DB_FILE, 'utf8');
    const certificates = JSON.parse(fileData || '[]');
    
    // Append and save
    certificates.push(newCertificate);
    fs.writeFileSync(DB_FILE, JSON.stringify(certificates, null, 2));

    const localIP = getLocalIPAddress();
    const certUrl = `http://${localIP}:${PORT}/?id=${certId}`;

    res.status(201).json({
      success: true,
      certificate: newCertificate,
      url: certUrl
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// API: Get all certificates (Admin only)
app.get('/api/certificates', requireAdmin, (req, res) => {
  try {
    const fileData = fs.readFileSync(DB_FILE, 'utf8');
    const certificates = JSON.parse(fileData || '[]');
    res.status(200).json({ success: true, certificates });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// API: Get single certificate (Public - no auth required)
app.get('/api/certificates/:id', (req, res) => {
  try {
    const id = req.params.id;
    const fileData = fs.readFileSync(DB_FILE, 'utf8');
    const certificates = JSON.parse(fileData || '[]');
    
    const certificate = certificates.find(c => c.id === id);
    if (certificate) {
      res.status(200).json({ success: true, certificate });
    } else {
      res.status(404).json({ success: false, error: 'Certificate not found.' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// API: Delete certificate (Admin only)
app.delete('/api/certificates/:id', requireAdmin, (req, res) => {
  try {
    const id = req.params.id;
    const fileData = fs.readFileSync(DB_FILE, 'utf8');
    let certificates = JSON.parse(fileData || '[]');

    const initialLength = certificates.length;
    certificates = certificates.filter(c => c.id !== id);

    if (certificates.length < initialLength) {
      fs.writeFileSync(DB_FILE, JSON.stringify(certificates, null, 2));
      res.status(200).json({ success: true, message: 'Certificate deleted successfully.' });
    } else {
      res.status(404).json({ success: false, error: 'Certificate not found.' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// API: Retrieve server configuration
app.get('/api/config', (req, res) => {
  res.status(200).json({
    localIP: getLocalIPAddress(),
    port: PORT
  });
});

// Fallback to serve index.html for single page app routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  const localIP = getLocalIPAddress();
  console.log(`==================================================`);
  console.log(`RKV Certificate Web Server running successfully!`);
  console.log(`- Local URL:        http://localhost:${PORT}`);
  console.log(`- Local network IP: http://${localIP}:${PORT}`);
  console.log(`==================================================`);
});
