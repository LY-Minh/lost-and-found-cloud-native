const express = require('express');
const cors = require('cors');
const adminReportRoutes = require('./routes/adminReports');

const app = express();
const PORT = process.env.PORT || 3004;

// Middleware
app.use(cors());
app.use(express.json());

// Routes — under the service prefix "/report" (Ingress fans out by first
// segment, no rewrite). Role is the 2nd segment.
// Admin routes: /report/admin/... (auth-svc validator enforces admin role)
app.use('/report/admin', adminReportRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'report-service' });
});

// Start server (no MongoDB needed - aggregates from other services)
app.listen(PORT, () => {
  console.log(`Report Service running on port ${PORT}`);
});
