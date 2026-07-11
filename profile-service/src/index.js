const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const studentProfileRoutes = require('./routes/studentProfile');

const app = express();
const PORT = process.env.PORT || 3005;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://mongo:27017/auth-db';

// Middleware
app.use(cors());
app.use(express.json());

// Routes — under the service prefix "/profile" (Ingress fans out by first
// segment, no rewrite). Role is the 2nd segment.
// Student routes: /profile/student/... (auth-svc validator enforces student role)
app.use('/profile/student', studentProfileRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'profile-service' });
});

// Connect to MongoDB (Users DB shared with auth-service) and start server
mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('Profile Service connected to MongoDB (Users DB)');
    app.listen(PORT, () => {
      console.log(`Profile Service running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
