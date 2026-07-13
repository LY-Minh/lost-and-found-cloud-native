const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const claimRoutes = require('./routes/claims');
const studentClaimRoutes = require('./routes/studentClaims');
const adminClaimRoutes = require('./routes/adminClaims');

const app = express();
const PORT = process.env.PORT || 3003;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://mongo:27017/claims-db';

// Shared-volume request log: /app/logs is the shared-logs-pvc mount (PV).
// The logger-pod reads this back (cat /logs/*.log).
const LOG_DIR = process.env.LOG_DIR || '/app/logs';
const LOG_FILE = path.join(LOG_DIR, 'claims.log');
try { fs.mkdirSync(LOG_DIR, { recursive: true }); } catch (_) { /* local dev without the mount */ }

app.use(cors());
app.use(express.json());

// Append one line per request to the shared volume (best-effort — never crash on log failure)
app.use((req, res, next) => {
  res.on('finish', () => {
    const line = `${new Date().toISOString()} [claims] ${req.method} ${req.originalUrl} -> ${res.statusCode}\n`;
    fs.appendFile(LOG_FILE, line, () => {});
  });
  next();
});

app.use('/claims/student', studentClaimRoutes);

app.use('/claims/admin', adminClaimRoutes);

app.use('/claims', claimRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'claims-service' });
});

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('Claims Service connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Claims Service running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
