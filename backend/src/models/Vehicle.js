const mongoose = require('mongoose');

const VehicleSchema = new mongoose.Schema({
  regNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  model: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    required: true,
    trim: true // e.g., Semi-Truck, Flatbed, Van, etc.
  },
  maxLoadCapacity: {
    type: Number, // in kg
    required: true
  },
  odometer: {
    type: Number, // in km
    required: true,
    default: 0
  },
  acquisitionCost: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['Available', 'On Trip', 'In Shop', 'Retired'],
    default: 'Available'
  }
}, {
  timestamps: true
});

VehicleSchema.index({ status: 1 });

module.exports = mongoose.model('Vehicle', VehicleSchema);
