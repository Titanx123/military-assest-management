const mongoose = require('mongoose');

const assetSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['vehicle', 'weapon', 'ammunition', 'equipment'],
    required: true
  },
  serialNumber: {
    type: String,
    unique: true,
    sparse: true
  },
  status: {
    type: String,
    enum: ['available', 'assigned', 'maintenance', 'decommissioned'],
    default: 'available'
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  assignedQuantity: {
    type: Number,
    default: 0
  },
  base: {
    type: String,
    required: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

const Asset = mongoose.model('Asset', assetSchema);
module.exports = Asset;
