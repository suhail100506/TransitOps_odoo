const mongoose = require('mongoose');

const VehicleSchema = new mongoose.Schema({
  regNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  registrationNumber: {
    type: String,
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
  capacity: {
    type: Number
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
    enum: ['Available', 'On Trip', 'In Shop', 'Retired', 'AVAILABLE', 'DISPATCHED', 'UNDER_MAINTENANCE', 'OUT_OF_SERVICE'],
    default: 'Available'
  },
  activeMaintenanceTicketId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MaintenanceTicket',
    default: null
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
    if (t.includes('VAN')) this.type = 'Van';
    else if (t.includes('TRUCK')) this.type = 'Semi-Truck';
    else if (t.includes('CAR')) this.type = 'Car';
    else if (t.includes('BUS')) this.type = 'Bus';
  }

  // Normalize status for backend/frontend consistency if possible
  if (this.status) {
    const s = this.status.toUpperCase();
    if (s === 'AVAILABLE') this.status = 'Available';
    else if (s === 'DISPATCHED') this.status = 'On Trip';
    else if (s === 'UNDER_MAINTENANCE') this.status = 'In Shop';
    else if (s === 'OUT_OF_SERVICE') this.status = 'Retired';
  }

  next();
});

VehicleSchema.index({ status: 1 });

module.exports = mongoose.model('Vehicle', VehicleSchema);
