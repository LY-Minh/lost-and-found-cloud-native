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

// Routes — all under the service prefix "/claims" (Ingress fans out by first
// segment, no rewrite). Role is the 2nd segment, enforced by the auth-svc
// validator. Register the role-specific routers BEFORE the catch-all "/claims"
// router so /claims/admin/... and /claims/student/... aren't shadowed by /:id.
// Student routes: /claims/student/... (validator enforces student role)
app.use('/claims/student', studentClaimRoutes);

// Admin routes: /claims/admin/... (validator enforces admin role)
app.use('/claims/admin', adminClaimRoutes);

// Authenticated routes (any role): /claims/:id
app.use('/claims', claimRoutes);

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
