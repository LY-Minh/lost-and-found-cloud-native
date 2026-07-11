const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const itemRoutes = require('./routes/items');
const adminItemRoutes = require('./routes/adminItems');

const app = express();
const PORT = process.env.PORT || 3002;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://mongo:27017/catalog-db';
const INSTANCE_ID = process.env.INSTANCE_ID || 'unknown';

// Middleware
app.use(cors());
app.use(express.json());

// Routes — all mounted under the service prefix "/catalog" so the Ingress can
// fan out by first path segment with NO rewrite. Role is the 2nd segment:
// the auth-svc validator reads it (/catalog/admin/... => admin required).
// Authenticated routes (any role): /catalog/items...
app.use('/catalog/items', itemRoutes);

// Admin routes: /catalog/admin/items... (auth-svc validator enforces admin role)
app.use('/catalog/admin/items', adminItemRoutes);

// Health check — includes INSTANCE_ID for load-balancing verification
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'catalog-service', instance: INSTANCE_ID });
});

// Connect to MongoDB and start server
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

