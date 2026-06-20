const express = require('express');
const Feedback = require('../models/Feedback');

const router = express.Router();

// GET /admin/feedback - Admin sees all feedback
router.get('/feedback', async (req, res) => {
  try {
    const feedbacks = await Feedback.find().sort({ createdAt: -1 });
    res.json(feedbacks);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch feedback', error: error.message });
  }
});

module.exports = router;
