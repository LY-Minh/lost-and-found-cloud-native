const express = require('express');
const cors = require('cors');
const adminReportRoutes = require('./routes/adminReports');

const app = express();
const PORT = process.env.PORT || 3004;

app.use(cors());
app.use(express.json());

app.use('/report/admin', adminReportRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'report-service' });
});

app.listen(PORT, () => {
  console.log(`Report Service running on port ${PORT}`);
});
