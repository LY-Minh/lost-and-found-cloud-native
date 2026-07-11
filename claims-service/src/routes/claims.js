const express = require('express');
const Claim = require('../models/Claim');

const router = express.Router();

// GET /claims/:id - Get a claim by id (any authenticated user)
// Token validated upstream by the auth-svc validator (via Ingress); any authenticated user, no role check needed
router.get('/:id', async (req, res) => {
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

module.exports = router;
