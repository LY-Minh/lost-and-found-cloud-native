const express = require('express');
const Item = require('../models/Item');

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

module.exports = router;
