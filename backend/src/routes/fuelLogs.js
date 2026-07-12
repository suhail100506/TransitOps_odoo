const express = require('express');
const FuelLog = require('../models/FuelLog');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @route   POST api/fuel-logs
// @desc    Log fuel intake for a vehicle
router.post('/', protect, async (req, res) => {
  try {
    const { vehicleId, liters, cost, date } = req.body;

    if (!vehicleId || !liters || !cost) {
      return res.status(400).json({ error: 'Please provide vehicle ID, liters, and cost' });
    }

    const log = await FuelLog.create({
      vehicleId,
      liters,
      cost,
      date: date || new Date()
    });

    res.status(201).json(log);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   GET api/fuel-logs
// @desc    Get all fuel logs
router.get('/', protect, async (req, res) => {
  try {
    const logs = await FuelLog.find({}).populate('vehicleId').sort({ date: -1 });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
