const express = require('express');
const Maintenance = require('../models/Maintenance');
const Vehicle = require('../models/Vehicle');
const { protect, allowRoles } = require('../middleware/auth');

const router = express.Router();

// @route   GET api/maintenance
// @desc    Get all maintenance records (with filters)
router.get('/', protect, async (req, res) => {
  try {
    const { vehicleId, status } = req.query;
    const query = {};
    if (vehicleId) query.vehicleId = vehicleId;
    if (status) query.status = status;

    const logs = await Maintenance.find(query)
      .populate('vehicleId')
      .sort({ createdAt: -1 });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   POST api/maintenance
// @desc    Open a maintenance record (puts vehicle in In Shop status)
router.post('/', protect, allowRoles(['fleet_manager']), async (req, res) => {
  try {
    const { vehicleId, description, cost } = req.body;

    if (!vehicleId || !description) {
      return res.status(400).json({ error: 'Please provide vehicle ID and description' });
    }

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    if (vehicle.status === 'On Trip') {
      return res.status(400).json({ error: 'Cannot send vehicle to shop while it is on a trip' });
    }

    // Update vehicle status to 'In Shop'
    vehicle.status = 'In Shop';
    await vehicle.save();

    const record = await Maintenance.create({
      vehicleId,
      description,
      cost: cost || 0,
      status: 'Open'
    });

    res.status(201).json(record);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   POST api/maintenance/:id/close
// @desc    Close maintenance record (releases vehicle to Available)
router.post('/:id/close', protect, allowRoles(['fleet_manager']), async (req, res) => {
  try {
    const record = await Maintenance.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ error: 'Maintenance record not found' });
    }

    if (record.status === 'Closed') {
      return res.status(400).json({ error: 'Maintenance ticket already closed' });
    }

    const vehicle = await Vehicle.findById(record.vehicleId);
    if (vehicle) {
      // Release vehicle to 'Available' (unless it was retired)
      if (vehicle.status !== 'Retired') {
        vehicle.status = 'Available';
        await vehicle.save();
      }
    }

    record.status = 'Closed';
    record.closedAt = new Date();
    await record.save();

    res.json(record);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
