const mongoose = require('mongoose');

const TripSchema = new mongoose.Schema({
  source: {
    type: String,
    trim: true
  },
  destination: {
    type: mongoose.Schema.Types.Mixed // can be a String or an Object with { name, lat, lng }
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
    enum: ['Draft', 'Dispatched', 'Completed', 'Cancelled', 'SCHEDULED', 'DISPATCHED', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED', 'DELAYED'],
    default: 'Draft'
  },
  dispatchedAt: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  
  // Trip branch specific fields
  tripCode: { type: String, unique: true, sparse: true },
  routeName: { type: String },
  origin: {
    name: { type: String },
    lat: { type: Number, default: 0 },
    lng: { type: Number, default: 0 }
  },
  scheduledDeparture: { type: Date },
  scheduledArrival: { type: Date },
  dispatchedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  currentStatus: {
    type: String,
    enum: ["SCHEDULED", "DISPATCHED", "IN_TRANSIT", "COMPLETED", "CANCELLED", "DELAYED"],
    default: "SCHEDULED"
  },
  lastSequence: { type: Number, default: 0 }
}, {
  timestamps: true
});

// Pre-validate synchronization hook
TripSchema.pre('validate', function (next) {
  // Sync origin/source
  if (this.origin?.name && !this.source) {
    this.source = this.origin.name;
  } else if (this.source && (!this.origin || !this.origin.name)) {
    this.origin = { name: this.source, lat: 0, lng: 0 };
  }

  // Sync destination
  if (this.destination && typeof this.destination === 'object' && this.destination.name) {
    // Already an object, ensure compatibility
    if (this.destination.name && !this.destNameCompatibility) {
      this.destNameCompatibility = this.destination.name;
    }
  } else if (typeof this.destination === 'string') {
    this.destination = { name: this.destination, lat: 0, lng: 0 };
  }

  // Sync status and currentStatus
  if (this.status && !this.currentStatus) {
    const s = this.status.toUpperCase();
    if (s === 'DRAFT') this.currentStatus = 'SCHEDULED';
    else if (s === 'DISPATCHED') this.currentStatus = 'DISPATCHED';
    else if (s === 'COMPLETED') this.currentStatus = 'COMPLETED';
    else if (s === 'CANCELLED') this.currentStatus = 'CANCELLED';
  } else if (this.currentStatus && !this.status) {
    const cs = this.currentStatus.toUpperCase();
    if (cs === 'SCHEDULED') this.status = 'Draft';
    else if (cs === 'DISPATCHED' || cs === 'IN_TRANSIT') this.status = 'Dispatched';
    else if (cs === 'COMPLETED') this.status = 'Completed';
    else if (cs === 'CANCELLED') this.status = 'Cancelled';
  }

  // Sync dates
  if (this.dispatchedAt && !this.scheduledDeparture) {
    this.scheduledDeparture = this.dispatchedAt;
  }
  if (this.completedAt && !this.scheduledArrival) {
    this.scheduledArrival = this.completedAt;
  }

  next();
});

TripSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.source = ret.origin?.name || ret.source || '';
    ret.status = ret.currentStatus || ret.status || 'Draft';
    if (ret.destination && typeof ret.destination === 'object') {
      ret.destination = ret.destination.name || '';
    }
    return ret;
  }
});

TripSchema.index({ vehicleId: 1 });
TripSchema.index({ driverId: 1 });
TripSchema.index({ status: 1 });

module.exports = mongoose.model('Trip', TripSchema);
