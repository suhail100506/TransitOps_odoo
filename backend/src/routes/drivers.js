const express = require('express');
const Driver = require('../models/Driver');
const { protect, allowRoles } = require('../middleware/auth');

const router = express.Router();

// @route   GET api/drivers/expiring-licenses
// @desc    Get drivers whose licenses expire within 30 days (not yet expired)
// NOTE: must be before /:id to avoid route conflict
router.get('/expiring-licenses', protect, async (req, res) => {
  try {
    const today = new Date();
    const in30Days = new Date();
    in30Days.setDate(in30Days.getDate() + 30);

    const drivers = await Driver.find({
      licenseExpiryDate: { $gt: today, $lte: in30Days },
      status: { $ne: 'Suspended' }
    }).sort({ licenseExpiryDate: 1 });

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
    const drivers = await Driver.find({
      status: 'Available',
      licenseExpiryDate: { $gt: today }
    });
    res.json(drivers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   GET api/drivers
// @desc    Get all drivers (with query filters and sorting)
router.get('/', protect, async (req, res) => {
  try {
    const { status } = req.query;
    const query = {};
    if (status) query.status = status;

    const drivers = await Driver.find(query).sort({ name: 1 });
    res.json(drivers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   GET api/drivers/:id
// @desc    Get a single driver by ID
router.get('/:id', protect, async (req, res) => {
  try {
    const driver = await Driver.findById(req.params.id);
    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }
    res.json(driver);
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
// @desc    Update driver details (name, contact, license info, safety score)
router.put('/:id', protect, allowRoles(['fleet_manager']), async (req, res) => {
  try {
    // If safety score is being updated and drops below 40, auto-suspend
    const updateData = { ...req.body };
    if (updateData.safetyScore !== undefined && updateData.safetyScore < 40) {
      updateData.status = 'Suspended';
    }

    const driver = await Driver.findByIdAndUpdate(req.params.id, updateData, {
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

// @route   PATCH api/drivers/:id/status
// @desc    Manager-only status change (Available, Off Duty, Suspended)
router.patch('/:id/status', protect, allowRoles(['fleet_manager']), async (req, res) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ['Available', 'Off Duty', 'Suspended'];

    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({
        error: `Invalid status. Allowed values: ${allowedStatuses.join(', ')}`
      });
    }

    const driver = await Driver.findById(req.params.id);
    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    if (driver.status === 'On Trip') {
      return res.status(400).json({
        error: 'Cannot change status of a driver who is currently On Trip. Complete or cancel their trip first.'
      });
    }

    driver.status = status;
    await driver.save();

    res.json(driver);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
