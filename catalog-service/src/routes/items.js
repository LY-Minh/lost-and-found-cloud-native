const express = require('express');
const Item = require('../models/Item');
const { authenticate, authorizeAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /items - Get all items
router.get('/', async (req, res) => {
  try {
    const items = await Item.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch items', error: error.message });
  }
});

// GET /items/lost - Get all lost items
router.get('/lost', async (req, res) => {
  try {
    const items = await Item.find({ status: 'lost' }).sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch lost items', error: error.message });
  }
});

// GET /items/found - Get all found items
router.get('/found', async (req, res) => {
  try {
    const items = await Item.find({ status: 'found' }).sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch found items', error: error.message });
  }
});

// GET /items/:id - Get item by id
router.get('/:id', async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    res.json(item);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch item', error: error.message });
  }
});

// POST /items - Post a lost/found item (student or admin)
router.post('/', authenticate, async (req, res) => {
  try {
    const { title, description, category, status, location } = req.body;
    const item = new Item({
      title,
      description,
      category,
      status,
      location,
      reportedBy: req.user.id
    });
    await item.save();
    res.status(201).json({ message: 'Item created successfully', item });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create item', error: error.message });
  }
});

// PUT /items/:id - Update item (admin only)
router.put('/:id', authenticate, authorizeAdmin, async (req, res) => {
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

// DELETE /items/:id - Delete item (admin only)
router.delete('/:id', authenticate, authorizeAdmin, async (req, res) => {
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
