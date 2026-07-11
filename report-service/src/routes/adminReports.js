const express = require('express');
const axios = require('axios');

const router = express.Router();

// Service-to-service base URLs. Defaults use the in-cluster Service DNS names
// (k8s Services: catalog-svc:3001, claims-svc:3002). Override via env in the
// report Deployment if the names/ports ever change.
const CATALOG_SERVICE_URL = process.env.CATALOG_SERVICE_URL || 'http://catalog-svc:3001';
const CLAIMS_SERVICE_URL = process.env.CLAIMS_SERVICE_URL || 'http://claims-svc:3002';

// Helper to forward auth headers for internal service-to-service requests
const getAuthHeaders = (req) => {
  return {
    'Authorization': req.headers.authorization || '',
    'X-User-Id': req.headers['x-user-id'] || '',
    'X-User-Email': req.headers['x-user-email'] || '',
    'X-User-Role': req.headers['x-user-role'] || ''
  };
};

// GET /admin/total-items - Get total lost & found items
router.get('/total-items', async (req, res) => {
  try {
    const response = await axios.get(`${CATALOG_SERVICE_URL}/catalog/items`, {
      headers: getAuthHeaders(req)
    });
    const items = response.data;

    const totalLost = items.filter(item => item.status === 'lost').length;
    const totalFound = items.filter(item => item.status === 'found').length;

    res.json({
      totalItems: items.length,
      totalLost,
      totalFound
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch item report', error: error.message });
  }
});

// GET /admin/total-claims - Get total claim submissions
router.get('/total-claims', async (req, res) => {
  try {
    const response = await axios.get(`${CLAIMS_SERVICE_URL}/claims/admin/claims`, {
      headers: getAuthHeaders(req)
    });
    const claims = response.data;

    res.json({
      totalClaims: claims.length
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch claims report', error: error.message });
  }
});

// GET /admin/pending-claims - Get all pending claims
router.get('/pending-claims', async (req, res) => {
  try {
    const response = await axios.get(`${CLAIMS_SERVICE_URL}/claims/admin/claims`, {
      headers: getAuthHeaders(req)
    });
    const claims = response.data;
    const pendingClaims = claims.filter(claim => claim.status === 'pending');

    res.json({
      totalPending: pendingClaims.length,
      pendingClaims
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch pending claims', error: error.message });
  }
});

// GET /admin/claims-by-status - Claims grouped by status
router.get('/claims-by-status', async (req, res) => {
  try {
    const response = await axios.get(`${CLAIMS_SERVICE_URL}/claims/admin/claims`, {
      headers: getAuthHeaders(req)
    });
    const claims = response.data;

    const approved = claims.filter(claim => claim.status === 'approved');
    const rejected = claims.filter(claim => claim.status === 'rejected');
    const pending = claims.filter(claim => claim.status === 'pending');

    res.json({
      approved: { count: approved.length, claims: approved },
      rejected: { count: rejected.length, claims: rejected },
      pending: { count: pending.length, claims: pending }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch claims by status', error: error.message });
  }
});

module.exports = router;
