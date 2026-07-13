const express = require('express');
const Claim = require('../models/Claim');

const router = express.Router();

router.get('/claims', async (req, res) => {
  try {
    const claims = await Claim.find().sort({ createdAt: -1 });
    res.json(claims);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch claims', error: error.message });
  }
});

router.put('/approve-claim/:id', async (req, res) => {
  try {
    const reviewedBy = req.headers['x-user-id'];
    const claim = await Claim.findByIdAndUpdate(
      req.params.id,
      { status: 'approved', reviewedBy },
      { new: true }
    );
    if (!claim) {
      return res.status(404).json({ message: 'Claim not found' });
    }
    res.json({ message: 'Claim approved successfully', claim });
  } catch (error) {
    res.status(500).json({ message: 'Failed to approve claim', error: error.message });
  }
});

router.put('/reject-claim/:id', async (req, res) => {
  try {
    const reviewedBy = req.headers['x-user-id'];
    const claim = await Claim.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected', reviewedBy },
      { new: true }
    );
    if (!claim) {
      return res.status(404).json({ message: 'Claim not found' });
    }
    res.json({ message: 'Claim rejected successfully', claim });
  } catch (error) {
    res.status(500).json({ message: 'Failed to reject claim', error: error.message });
  }
});

module.exports = router;
