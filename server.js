const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const os = require('os');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Ensure uploads directory exists
const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Serve frontend static files
app.use(express.static(__dirname));

// Serve uploads directory
app.use('/uploads', express.static(UPLOADS_DIR));

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

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const cleanName = path.basename(file.originalname, path.extname(file.originalname))
      .replace(/[^a-zA-Z0-9]/g, '_')
      .toLowerCase();
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${cleanName}-${timestamp}${ext}`);
  }
});

// File filter to allow only PDFs
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (file.mimetype === 'application/pdf' || ext === '.pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// API Endpoint to upload a new PDF
app.post('/api/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded.' });
    }

    const localIP = getLocalIPAddress();
    const fileUrl = `http://${localIP}:${PORT}/uploads/${req.file.filename}`;

    res.status(200).json({
      success: true,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      url: fileUrl,
      localIP: localIP,
      port: PORT
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// API Endpoint to get all stored PDF files
app.get('/api/files', (req, res) => {
  try {
    fs.readdir(UPLOADS_DIR, (err, files) => {
      if (err) {
        return res.status(500).json({ success: false, error: 'Unable to scan uploads folder.' });
      }

      const localIP = getLocalIPAddress();
      const fileList = files
        .filter(file => file.toLowerCase().endsWith('.pdf'))
        .map(file => {
          const filePath = path.join(UPLOADS_DIR, file);
          const stats = fs.statSync(filePath);
          
          // Reconstruct original name if possible
          // Filename format: name-timestamp.pdf
          const lastDashIndex = file.lastIndexOf('-');
          let originalName = file;
          if (lastDashIndex !== -1) {
            originalName = file.substring(0, lastDashIndex) + '.pdf';
          }

          return {
            filename: file,
            originalName: originalName,
            size: stats.size,
            uploadedAt: stats.mtime,
            url: `http://${localIP}:${PORT}/uploads/${file}`
          };
        })
        // Sort by most recent upload
        .sort((a, b) => b.uploadedAt - a.uploadedAt);

      res.status(200).json({ success: true, files: fileList });
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// API Endpoint to delete a PDF file
app.delete('/api/files/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    // Basic security check to prevent directory traversal
    if (filename.includes('/') || filename.includes('..') || filename.includes('\\')) {
      return res.status(400).json({ success: false, error: 'Invalid filename.' });
    }

    const filePath = path.join(UPLOADS_DIR, filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.status(200).json({ success: true, message: 'File deleted successfully.' });
    } else {
      res.status(404).json({ success: false, error: 'File not found.' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// API Endpoint to retrieve server configuration
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
  console.log(`PDF-to-QR Web Server running successfully!`);
  console.log(`- Local URL:        http://localhost:${PORT}`);
  console.log(`- Local network IP: http://${localIP}:${PORT}`);
  console.log(`==================================================`);
});
