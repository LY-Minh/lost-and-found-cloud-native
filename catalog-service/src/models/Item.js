const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true
  },
  status: {
    type: String,
    enum: ['lost', 'found'],
    required: [true, 'Status is required']
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true
  },
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, 'Reporter ID is required']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Item', itemSchema);
