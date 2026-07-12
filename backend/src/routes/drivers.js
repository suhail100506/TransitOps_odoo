const express = require('express');
const Driver = require('../models/Driver');
const { protect, allowRoles } = require('../middleware/auth');

const router = express.Router();

// @route   GET api/drivers
// @desc    Get all drivers (with query filters)
router.get('/', protect, async (req, res) => {
  try {
    const { status } = req.query;
    const query = {};
    if (status) query.status = status;

    const drivers = await Driver.find(query);
    res.json(drivers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   GET api/drivers/available
// @desc    Get available, active, non-expired license drivers
router.get('/available', protect, async (req, res) => {
  try {
    const today = new Date();
    // Exclude Suspended, Off Duty, and expired licenses
    const drivers = await Driver.find({
      status: 'Available',
      licenseExpiryDate: { $gt: today }
    });
    res.json(drivers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   POST api/drivers
// @desc    Create a new driver record
router.post('/', protect, allowRoles(['fleet_manager']), async (req, res) => {
  try {
    const { name, licenseNumber, licenseCategory, licenseExpiryDate, contactNumber } = req.body;

    if (!name || !licenseNumber || !licenseCategory || !licenseExpiryDate || !contactNumber) {
      return res.status(400).json({ error: 'Please provide all required fields' });
    }

    const licenseExists = await Driver.findOne({ licenseNumber: licenseNumber.toUpperCase() });
    if (licenseExists) {
      return res.status(400).json({ error: 'Driver with this license number already exists' });
    }

    const driver = await Driver.create({
      name,
      licenseNumber: licenseNumber.toUpperCase(),
      licenseCategory,
      licenseExpiryDate,
      contactNumber,
      status: 'Available',
      safetyScore: 100
    });

    res.status(201).json(driver);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   PUT api/drivers/:id
// @desc    Update driver details (e.g. status, safety score)
router.put('/:id', protect, allowRoles(['fleet_manager']), async (req, res) => {
  try {
    const driver = await Driver.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    res.json(driver);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
