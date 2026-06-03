const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const itemRoutes = require('./routes/items');

const app = express();
const PORT = process.env.PORT || 3002;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://mongo:27017/catalog-db';

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/items', itemRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'catalog-service' });
});

// Connect to MongoDB and start server
mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('Catalog Service connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Catalog Service running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
