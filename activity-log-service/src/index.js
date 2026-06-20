const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const internalLogRoutes = require('./routes/internalLog');
const adminLogRoutes = require('./routes/adminLogs');

const app = express();
const PORT = process.env.PORT || 3005;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://mongo:27017/logs-db';

// Middleware
app.use(cors());
app.use(express.json());

// Routes
// Internal route - blocked by Nginx for external traffic
app.use('/internal', internalLogRoutes);

// Admin routes - Nginx enforces admin role
app.use('/admin', adminLogRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'activity-log-service' });
});

// Connect to MongoDB and start server
mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('Activity Log Service connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Activity Log Service running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
