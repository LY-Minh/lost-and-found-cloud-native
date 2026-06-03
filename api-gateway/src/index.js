const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PORT || 3000;

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://auth-service:3001';
const CATALOG_SERVICE_URL = process.env.CATALOG_SERVICE_URL || 'http://catalog-service:3002';
const CLAIMS_SERVICE_URL = process.env.CLAIMS_SERVICE_URL || 'http://claims-service:3003';
const REPORT_SERVICE_URL = process.env.REPORT_SERVICE_URL || 'http://report-service:3004';

// Middleware
app.use(cors());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'api-gateway' });
});

// Proxy routes
app.use('/auth', createProxyMiddleware({
  target: AUTH_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/auth': '/auth' }
}));

app.use('/items', createProxyMiddleware({
  target: CATALOG_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/items': '/items' }
}));

app.use('/claims', createProxyMiddleware({
  target: CLAIMS_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/claims': '/claims' }
}));

app.use('/report', createProxyMiddleware({
  target: REPORT_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/report': '/report' }
}));

// Start server
app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
  console.log(`  /auth    -> ${AUTH_SERVICE_URL}`);
  console.log(`  /items   -> ${CATALOG_SERVICE_URL}`);
  console.log(`  /claims  -> ${CLAIMS_SERVICE_URL}`);
  console.log(`  /report  -> ${REPORT_SERVICE_URL}`);
});
