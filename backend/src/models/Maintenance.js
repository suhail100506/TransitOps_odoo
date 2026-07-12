const mongoose = require('mongoose');

const MaintenanceSchema = new mongoose.Schema({
  vehicleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  cost: {
    type: Number,
    required: true,
    default: 0
  },
  status: {
    type: String,
    enum: ['Open', 'Closed'],
    default: 'Open'
  },
  closedAt: {
    type: Date
  }
}, {
  timestamps: true
});

MaintenanceSchema.index({ vehicleId: 1 });
MaintenanceSchema.index({ status: 1 });

module.exports = mongoose.model('Maintenance', MaintenanceSchema);
