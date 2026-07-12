const express = require('express');
const Expense = require('../models/Expense');
const Vehicle = require('../models/Vehicle');
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
// @desc    Get all general expenses with optional filters
router.get('/', protect, async (req, res) => {
  try {
    const { type, vehicleStatus, vehicleId } = req.query;
    
    // Build vehicle query if filters provided
    let vehicleIds = null;
    if (vehicleStatus) {
      const vQuery = { status: vehicleStatus };
      const vehicles = await Vehicle.find(vQuery).select('_id');
      vehicleIds = vehicles.map(v => v._id);
    }
    
    // Build expense query
    const eQuery = {};
    if (type) {
      eQuery.type = type; // Filter by 'toll' or 'other'
    }
    if (vehicleId) {
      eQuery.vehicleId = vehicleId;
    } else if (vehicleIds) {
      eQuery.vehicleId = { $in: vehicleIds };
    }
    
    const expenses = await Expense.find(eQuery).populate('vehicleId').sort({ date: -1 });
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   GET api/expenses/:id
// @desc    Get a single expense
router.get('/:id', protect, async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id).populate('vehicleId');
    if (!expense) return res.status(404).json({ error: 'Expense not found' });
    res.json(expense);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   PUT api/expenses/:id
// @desc    Update an expense
router.put('/:id', protect, async (req, res) => {
  try {
    const { type, amount, date } = req.body;
    const expense = await Expense.findById(req.params.id);
    
    if (!expense) return res.status(404).json({ error: 'Expense not found' });
    
    if (type) expense.type = type;
    if (amount) expense.amount = amount;
    if (date) expense.date = date;
    
    await expense.save();
    res.json(expense);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   DELETE api/expenses/:id
// @desc    Delete an expense
router.delete('/:id', protect, async (req, res) => {
  try {
    const expense = await Expense.findByIdAndDelete(req.params.id);
    if (!expense) return res.status(404).json({ error: 'Expense not found' });
    res.json({ message: 'Expense removed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
