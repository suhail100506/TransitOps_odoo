const mongoose = require("mongoose");

const maintenanceLogSchema = new mongoose.Schema(
  {
    ticketId: { type: mongoose.Schema.Types.ObjectId, ref: "MaintenanceTicket", required: true },
    status: {
      type: String,
      enum: ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"],
      required: true,
    },
    sequence: { type: Number, required: true },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    note: { type: String },
    cost: { type: Number, default: 0 },
  },
  { timestamps: true }
);

maintenanceLogSchema.index({ ticketId: 1, sequence: 1 }, { unique: true });

maintenanceLogSchema.pre("save", function (next) {
  if (!this.isNew) return next(new Error("MaintenanceLog is append-only and cannot be modified."));
  next();
});

maintenanceLogSchema.pre(["updateOne", "findOneAndUpdate", "updateMany"], function (next) {
  next(new Error("MaintenanceLog is append-only and cannot be updated."));
});

module.exports = mongoose.model("MaintenanceLog", maintenanceLogSchema);
