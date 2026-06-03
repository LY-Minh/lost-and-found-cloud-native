const express = require('express');
const Claim = require('../models/Claim');
const { authenticate, authorizeAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /claims - Get all claims (admin)
router.get('/', authenticate, authorizeAdmin, async (req, res) => {
  try {
    const claims = await Claim.find().sort({ createdAt: -1 });
    res.json(claims);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch claims', error: error.message });
  }
});

// GET /claims/my-claims - Get own claims (student)
router.get('/my-claims', authenticate, async (req, res) => {
  try {
    const claims = await Claim.find({ claimedBy: req.user.id }).sort({ createdAt: -1 });
    res.json(claims);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch claims', error: error.message });
  }
});

// GET /claims/:id - Get a claim by id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const claim = await Claim.findById(req.params.id);
    if (!claim) {
      return res.status(404).json({ message: 'Claim not found' });
    }
    res.json(claim);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch claim', error: error.message });
  }
});

// POST /claims - Submit a claim (student)
router.post('/', authenticate, async (req, res) => {
  try {
    const { itemId, message } = req.body;
    const claim = new Claim({
      itemId,
      claimedBy: req.user.id,
      message
    });
    await claim.save();
    res.status(201).json({ message: 'Claim submitted successfully', claim });
  } catch (error) {
    res.status(500).json({ message: 'Failed to submit claim', error: error.message });
  }
});

// PUT /claims/:id/approve - Approve a claim (admin)
router.put('/:id/approve', authenticate, authorizeAdmin, async (req, res) => {
  try {
    const claim = await Claim.findByIdAndUpdate(
      req.params.id,
      { status: 'approved', reviewedBy: req.user.id },
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

// PUT /claims/:id/reject - Reject a claim (admin)
router.put('/:id/reject', authenticate, authorizeAdmin, async (req, res) => {
  try {
    const claim = await Claim.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected', reviewedBy: req.user.id },
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
