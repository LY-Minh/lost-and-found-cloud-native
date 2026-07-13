const express = require('express');
const Claim = require('../models/Claim');

const router = express.Router();

router.get('/my-claims', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const claims = await Claim.find({ claimedBy: userId }).sort({ createdAt: -1 });
    res.json(claims);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch claims', error: error.message });
  }
});

router.post('/submit-claim', async (req, res) => {
  try {
    const { itemId, message } = req.body;
    const claimedBy = req.headers['x-user-id'];

    const claim = new Claim({
      itemId,
      claimedBy,
      message
    });
    await claim.save();
    res.status(201).json({ message: 'Claim submitted successfully', claim });
  } catch (error) {
    res.status(500).json({ message: 'Failed to submit claim', error: error.message });
  }
});

module.exports = router;
