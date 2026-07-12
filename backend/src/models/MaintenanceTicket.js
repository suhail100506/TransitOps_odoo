const mongoose = require("mongoose");

const maintenanceTicketSchema = new mongoose.Schema(
  {
    ticketCode: { type: String, unique: true },
    vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle", required: true },
    category: {
      type: String,
      enum: ["BREAKDOWN", "SCHEDULED_SERVICE", "INSPECTION", "ACCIDENT_DAMAGE", "OTHER"],
      required: true,
    },
    priority: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
      required: true,
    },
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    currentStatus: {
      type: String,
      enum: ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"],
      default: "OPEN",
    },
    description: { type: String, required: true },
    lastSequence: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("MaintenanceTicket", maintenanceTicketSchema);
