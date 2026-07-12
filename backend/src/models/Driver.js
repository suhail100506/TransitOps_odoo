const mongoose = require('mongoose');

const DriverSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  licenseNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  licenseCategory: {
    type: String, // e.g. Class A, Class B, Heavy Vehicle
    required: true,
    trim: true
  },
  licenseExpiryDate: {
    type: Date,
    required: true
  },
  contactNumber: {
    type: String,
    required: true,
    trim: true
  },
  safetyScore: {
    type: Number, // 0 - 100
    default: 100,
    min: 0,
    max: 100
  },
  status: {
    type: String,
    enum: ['Available', 'On Trip', 'Off Duty', 'Suspended'],
    default: 'Available'
  }
}, {
  timestamps: true
});

DriverSchema.index({ status: 1 });

module.exports = mongoose.model('Driver', DriverSchema);
