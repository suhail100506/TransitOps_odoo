const mongoose = require('mongoose');

const TripSchema = new mongoose.Schema({
  source: {
    type: String,
    required: true,
    trim: true
  },
  destination: {
    type: String,
    required: true,
    trim: true
  },
  vehicleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true
  },
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver',
    required: true
  },
  cargoWeight: {
    type: Number, // in kg
    required: true
  },
  plannedDistance: {
    type: Number, // in km
    required: true
  },
  actualDistance: {
    type: Number, // in km
    default: 0
  },
  fuelConsumed: {
    type: Number, // in Litres
    default: 0
  },
  status: {
    type: String,
    enum: ['Draft', 'Dispatched', 'Completed', 'Cancelled'],
    default: 'Draft'
  },
  dispatchedAt: {
    type: Date
  },
  completedAt: {
    type: Date
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Trip', TripSchema);
