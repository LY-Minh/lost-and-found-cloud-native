const express = require('express');
const cors = require('cors');
const reportRoutes = require('./routes/reports');

const app = express();
const PORT = process.env.PORT || 3004;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/report', reportRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'report-service' });
});

// Start server (no MongoDB needed)
app.listen(PORT, () => {
  console.log(`Report Service running on port ${PORT}`);
});
