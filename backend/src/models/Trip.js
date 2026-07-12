const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema({
  tripCode: { type: String, unique: true },
  routeName: { type: String },
  origin: {
    name: { type: String, required: true },
    lat: { type: Number, default: 0 },
    lng: { type: Number, default: 0 }
  },
  destination: {
    name: { type: String, required: true },
    lat: { type: Number, default: 0 },
    lng: { type: Number, default: 0 }
  },
  scheduledDeparture: { type: Date, required: true },
  scheduledArrival: { type: Date, required: true },
  vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle", required: true },
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  dispatchedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  currentStatus: {
    type: String,
    enum: ["SCHEDULED", "DISPATCHED", "IN_TRANSIT", "COMPLETED", "CANCELLED", "DELAYED"],
    default: "SCHEDULED",
  },
  lastSequence: { type: Number, default: 0 },
  cargoWeight: { type: Number, required: true },
  plannedDistance: { type: Number, required: true },
  actualDistance: { type: Number },
  fuelConsumed: { type: Number },
  dispatchedAt: { type: Date },
  completedAt: { type: Date }
}, {
  timestamps: true
});

tripSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.source = ret.origin?.name || '';
    ret.status = ret.currentStatus || 'SCHEDULED';
    if (ret.destination && typeof ret.destination === 'object') {
      ret.destination = ret.destination.name || '';
    }
    return ret;
  }
});

module.exports = mongoose.model("Trip", tripSchema);
TripSchema.index({ vehicleId: 1 });
TripSchema.index({ driverId: 1 });
TripSchema.index({ status: 1 });

module.exports = mongoose.model('Trip', TripSchema);
