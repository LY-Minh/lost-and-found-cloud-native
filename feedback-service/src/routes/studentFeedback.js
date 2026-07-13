const express = require('express');
const Feedback = require('../models/Feedback');

const router = express.Router();

router.post('/submit-feedback', async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.headers['x-user-id'];

    if (!message) {
      return res.status(400).json({ message: 'Feedback message is required' });
    }

    const feedback = new Feedback({
      userId,
      message
    });

    await feedback.save();
    res.status(201).json({ message: 'Feedback submitted successfully', feedback });
  } catch (error) {
    res.status(500).json({ message: 'Failed to submit feedback', error: error.message });
  }
});

module.exports = router;
