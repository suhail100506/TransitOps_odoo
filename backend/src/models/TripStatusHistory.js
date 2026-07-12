const mongoose = require("mongoose");

const tripStatusHistorySchema = new mongoose.Schema(
  {
    tripId: { type: mongoose.Schema.Types.ObjectId, ref: "Trip", required: true },
    status: {
      type: String,
      enum: ["SCHEDULED", "DISPATCHED", "IN_TRANSIT", "COMPLETED", "CANCELLED", "DELAYED"],
      required: true,
    },
    sequence: { type: Number, required: true },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    note: { type: String },
    location: { lat: Number, lng: Number },
  },
  { timestamps: true }
);

tripStatusHistorySchema.index({ tripId: 1, sequence: 1 }, { unique: true });

tripStatusHistorySchema.pre("save", function (next) {
  if (!this.isNew) return next(new Error("TripStatusHistory is append-only and cannot be modified."));
  next();
});

tripStatusHistorySchema.pre(["updateOne", "findOneAndUpdate", "updateMany"], function (next) {
  next(new Error("TripStatusHistory is append-only and cannot be updated."));
});

module.exports = mongoose.model("TripStatusHistory", tripStatusHistorySchema);
