const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const studentFeedbackRoutes = require('./routes/studentFeedback');
const adminFeedbackRoutes = require('./routes/adminFeedback');

const app = express();
const PORT = process.env.PORT || 3006;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://mongo:27017/feedback-db';

// Middleware
app.use(cors());
app.use(express.json());

// Routes
// Student routes - Nginx enforces student role
app.use('/student', studentFeedbackRoutes);

// Admin routes - Nginx enforces admin role
app.use('/admin', adminFeedbackRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'feedback-service' });
});

// Connect to MongoDB and start server
mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('Feedback Service connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Feedback Service running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
