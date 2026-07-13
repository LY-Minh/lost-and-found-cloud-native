const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const itemRoutes = require('./routes/items');
const adminItemRoutes = require('./routes/adminItems');

const app = express();
const PORT = process.env.PORT || 3002;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://mongo:27017/catalog-db';
const INSTANCE_ID = process.env.INSTANCE_ID || 'unknown';

// Shared-volume request log: /app/logs is the shared-logs-pvc mount (PV).
// The logger sidecar + logger-pod read this file back (cat /logs/catalog.log).
const LOG_DIR = process.env.LOG_DIR || '/app/logs';
const LOG_FILE = path.join(LOG_DIR, 'catalog.log');
try { fs.mkdirSync(LOG_DIR, { recursive: true }); } catch (_) { /* local dev without the mount */ }

app.use(cors());
app.use(express.json());

// Append one line per request to the shared volume (best-effort — never crash on log failure)
app.use((req, res, next) => {
  res.on('finish', () => {
    const line = `${new Date().toISOString()} [catalog:${INSTANCE_ID}] ${req.method} ${req.originalUrl} -> ${res.statusCode}\n`;
    fs.appendFile(LOG_FILE, line, () => {});
  });
  next();
});

app.use('/catalog/items', itemRoutes);

app.use('/catalog/admin/items', adminItemRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'catalog-service', instance: INSTANCE_ID });
});

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('Catalog Service connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Catalog Service running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

