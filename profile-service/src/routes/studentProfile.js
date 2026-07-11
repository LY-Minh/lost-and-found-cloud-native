const express = require('express');
const User = require('../models/User');

const router = express.Router();

// GET /student/me - Retrieve the logged-in student's profile
// The auth-svc validator (via Ingress) validates the JWT and injects the X-User-Id header
router.get('/me', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({ message: 'User ID missing from request' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user.toJSON());
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch profile', error: error.message });
  }
});

// PUT /student/update - Update the logged-in student's profile (name only)
// Password and role changes are intentionally blocked; use auth-service for those.
router.put('/update', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({ message: 'User ID missing from request' });
    }

    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Name is required to update profile' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { name: name.trim() },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser.toJSON()
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update profile', error: error.message });
  }
});

module.exports = router;
