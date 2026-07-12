const mongoose = require('mongoose');

const FuelLogSchema = new mongoose.Schema({
  vehicleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true
  },
  liters: {
    type: Number,
    required: true
  },
  cost: {
    type: Number,
    required: true
  },
  date: {
    type: Date,
    default: Date.now,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('FuelLog', FuelLogSchema);
