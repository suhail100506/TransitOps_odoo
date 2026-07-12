const express = require('express');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const authorize = require('../middleware/rbac');

const router = express.Router();

router.get('/', protect, async (req, res) => {
  try {
    const { status } = req.query;
    const query = { role: 'Driver' };

    if (status) {
      if (status === 'Available') query.driverStatus = 'Available';
      else if (status === 'On Trip') query.driverStatus = 'On Trip';
      else query.driverStatus = status;
    }

    const drivers = await User.find(query).select('-passwordHash');
    res.json(drivers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/available', protect, async (req, res) => {
  try {
    const today = new Date();
    const drivers = await User.find({
      role: 'Driver',
      driverStatus: 'Available',
      licenseExpiryDate: { $gt: today }
    }).select('-passwordHash');
    res.json(drivers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   POST api/drivers
// @desc    Create a new driver record
router.post('/', protect, allowRoles(['fleet_manager', 'safety_officer']), async (req, res) => {
  try {
    const { name, licenseNumber, licenseCategory, licenseExpiryDate, contactNumber, email, password } = req.body;

    if (!name || !licenseNumber || !licenseCategory || !licenseExpiryDate || !contactNumber) {
      return res.status(400).json({ error: 'Please provide all required fields' });
    }

    const licenseExists = await User.findOne({ licenseNumber: licenseNumber.toUpperCase() });
    if (licenseExists) {
      return res.status(400).json({ error: 'Driver with this license number already exists' });
    }

    const driverEmail = email || `driver_${licenseNumber.toLowerCase()}@transitops.com`;
    const driverPassword = password || 'password';

    const driver = await User.create({
      name,
      email: driverEmail,
      passwordHash: driverPassword,
      role: 'Driver',
      phone: contactNumber,
      licenseNumber: licenseNumber.toUpperCase(),
      licenseCategory,
      licenseExpiryDate,
      contactNumber,
      driverStatus: 'Available',
      safetyScore: 100
    });

    res.status(201).json(driver);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   PUT api/drivers/:id
// @desc    Update driver details (e.g. status, safety score)
router.put('/:id', protect, allowRoles(['fleet_manager', 'safety_officer']), async (req, res) => {
  try {
    if (req.body.status !== undefined) {
      req.body.driverStatus = req.body.status;
    }

    const driver = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).select('-passwordHash');

    if (!driver || driver.role !== 'Driver') {
      return res.status(404).json({ error: 'Driver not found' });
    }

    res.json(driver);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
