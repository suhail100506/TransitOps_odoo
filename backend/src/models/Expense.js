const mongoose = require('mongoose');

const ExpenseSchema = new mongoose.Schema({
  vehicleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true
  },
  type: {
    type: String,
    enum: ['toll', 'fuel', 'parking', 'incidental', 'other'],
    required: true
  },
  amount: {
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

ExpenseSchema.index({ vehicleId: 1 });

module.exports = mongoose.model('Expense', ExpenseSchema);
