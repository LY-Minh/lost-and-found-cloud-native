const express = require('express');
const ActivityLog = require('../models/ActivityLog');

const router = express.Router();

// POST /internal/log-action - Log an action (called by other services)
// Nginx blocks external access to this route
router.post('/log-action', async (req, res) => {
  try {
    const { userId, action, description } = req.body;
    
    if (!userId || !action || !description) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const log = new ActivityLog({
      userId,
      action,
      description
    });
    
    await log.save();
    res.status(201).json({ message: 'Action logged successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to log action', error: error.message });
  }
});

module.exports = router;
