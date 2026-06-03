const mongoose = require('mongoose');

const claimSchema = new mongoose.Schema({
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, 'Item ID is required']
  },
  claimedBy: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, 'Claimer ID is required']
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  message: {
    type: String,
    required: [true, 'Claim message is required'],
    trim: true
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
claimSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

claimSchema.pre('findOneAndUpdate', function (next) {
  this.set({ updatedAt: Date.now() });
  next();
});

module.exports = mongoose.model('Claim', claimSchema);
