const express = require('express');
const Item = require('../models/Item');

const router = express.Router();

// POST /admin/items - Create a new item (admin/teacher only)
// Nginx enforces admin role; user info comes via X-User-Id header
router.post('/', async (req, res) => {
  try {
    const { title, description, category, status, location } = req.body;
    const reportedBy = req.headers['x-user-id'];

    const item = new Item({
      title,
      description,
      category,
      status,
      location,
      reportedBy
    });
    await item.save();
    res.status(201).json({ message: 'Item created successfully', item });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create item', error: error.message });
  }
});

// PUT /admin/items/:id - Update item (admin only)
router.put('/:id', async (req, res) => {
  try {
    const { title, description, category, status, location } = req.body;
    const item = await Item.findByIdAndUpdate(
      req.params.id,
      { title, description, category, status, location },
      { new: true, runValidators: true }
    );
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    res.json({ message: 'Item updated successfully', item });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update item', error: error.message });
  }
});

// DELETE /admin/items/:id - Delete item (admin only)
router.delete('/:id', async (req, res) => {
  try {
    const item = await Item.findByIdAndDelete(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete item', error: error.message });
  }
});

module.exports = router;
