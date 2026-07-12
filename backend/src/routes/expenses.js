const express = require('express');
const Expense = require('../models/Expense');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @route   POST api/expenses
// @desc    Log general expense (toll or other) for a vehicle
router.post('/', protect, async (req, res) => {
  try {
    const { vehicleId, type, amount, date } = req.body;

    if (!vehicleId || !type || !amount) {
      return res.status(400).json({ error: 'Please provide vehicle ID, type, and amount' });
    }

    const expense = await Expense.create({
      vehicleId,
      type,
      amount,
      date: date || new Date()
    });

    res.status(201).json(expense);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   GET api/expenses
// @desc    Get all general expenses
router.get('/', protect, async (req, res) => {
  try {
    const expenses = await Expense.find({}).populate('vehicleId').sort({ date: -1 });
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
