const express = require('express');
const ActivityLog = require('../models/ActivityLog');

const router = express.Router();

// GET /admin/all-log - Admin sees all activity logs
router.get('/all-log', async (req, res) => {
  try {
    const logs = await ActivityLog.find().sort({ createdAt: -1 });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch logs', error: error.message });
  }
});

// GET /admin/logs/:userId - Admin sees logs by specific user
router.get('/logs/:userId', async (req, res) => {
  try {
    const logs = await ActivityLog.find({ userId: req.params.userId }).sort({ createdAt: -1 });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch user logs', error: error.message });
  }
});

module.exports = router;
