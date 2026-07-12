const mongoose = require('mongoose');

const VehicleSchema = new mongoose.Schema({
  registrationNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  type: {
    type: String,
    enum: ["BUS", "VAN", "TRUCK", "CAR"],
    required: true
  },
  capacity: {
    type: Number
  },
  status: {
    type: String,
    enum: ["AVAILABLE", "DISPATCHED", "UNDER_MAINTENANCE", "OUT_OF_SERVICE"],
    default: "AVAILABLE"
  },
  activeMaintenanceTicketId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "MaintenanceTicket",
    default: null
  },
  // Legacy / frontend compatibility fields
  regNumber: {
    type: String,
    trim: true,
    uppercase: true
  },
  name: {
    type: String,
    trim: true
  },
  model: {
    type: String,
    trim: true
  },
  maxLoadCapacity: {
    type: Number
  },
  odometer: {
    type: Number,
    default: 0
  },
  acquisitionCost: {
    type: Number
  }
}, {
  timestamps: true
});

// Sync registrationNumber <-> regNumber, capacity <-> maxLoadCapacity before validate
VehicleSchema.pre('validate', function (next) {
  if (this.regNumber && !this.registrationNumber) {
    this.registrationNumber = this.regNumber;
  } else if (this.registrationNumber && !this.regNumber) {
    this.regNumber = this.registrationNumber;
  }

  if (this.maxLoadCapacity !== undefined && this.capacity === undefined) {
    this.capacity = this.maxLoadCapacity;
  } else if (this.capacity !== undefined && this.maxLoadCapacity === undefined) {
    this.maxLoadCapacity = this.capacity;
  }

  if (this.type) {
    const t = this.type.toUpperCase();
    if (t.includes('VAN')) this.type = 'VAN';
    else if (t.includes('TRUCK')) this.type = 'TRUCK';
    else if (t.includes('CAR')) this.type = 'CAR';
    else if (t.includes('BUS')) this.type = 'BUS';
    else this.type = 'TRUCK';
  }

  next();
});
VehicleSchema.index({ status: 1 });

module.exports = mongoose.model('Vehicle', VehicleSchema);
