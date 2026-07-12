const mongoose = require("mongoose");

const maintenanceScheduleSchema = new mongoose.Schema(
  {
    vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle", required: true },
    scheduleType: {
      type: String,
      enum: ["MILEAGE_BASED", "TIME_BASED"],
      required: true,
    },
    dueDate: { type: Date },
    dueMileage: { type: Number },
    status: {
      type: String,
      enum: ["UPCOMING", "DUE", "OVERDUE", "COMPLETED"],
      default: "UPCOMING",
    },
    linkedTicketId: { type: mongoose.Schema.Types.ObjectId, ref: "MaintenanceTicket", default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("MaintenanceSchedule", maintenanceScheduleSchema);
