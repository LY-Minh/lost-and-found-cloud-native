const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const claimRoutes = require('./routes/claims');
const studentClaimRoutes = require('./routes/studentClaims');
const adminClaimRoutes = require('./routes/adminClaims');

const app = express();
const PORT = process.env.PORT || 3003;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://mongo:27017/claims-db';

// Middleware
app.use(cors());
app.use(express.json());

// Routes
// Authenticated routes (any role) - Nginx validates token
app.use('/claims', claimRoutes);

// Student routes - Nginx enforces student role
app.use('/student', studentClaimRoutes);

// Admin routes - Nginx enforces admin role
app.use('/admin', adminClaimRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'claims-service' });
});

// Connect to MongoDB and start server
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
