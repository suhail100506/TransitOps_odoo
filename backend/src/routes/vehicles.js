const express = require('express');
const Vehicle = require('../models/Vehicle');
const FuelLog = require('../models/FuelLog');
const Maintenance = require('../models/Maintenance');
const { protect, allowRoles } = require('../middleware/auth');

const router = express.Router();

// @route   GET api/vehicles
// @desc    Get all vehicles (with query filters)
router.get('/', protect, async (req, res) => {
  try {
    const { status, type } = req.query;
    const query = {};
    if (status) query.status = status;
    if (type) query.type = type;

    const vehicles = await Vehicle.find(query);
    res.json(vehicles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   GET api/vehicles/available
// @desc    Get available vehicles only
router.get('/available', protect, async (req, res) => {
  try {
    const vehicles = await Vehicle.find({ status: 'Available' });
    res.json(vehicles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   POST api/vehicles
// @desc    Register a new vehicle
router.post('/', protect, allowRoles(['fleet_manager']), async (req, res) => {
  try {
    const { regNumber, name, model, type, maxLoadCapacity, odometer, acquisitionCost } = req.body;

    if (!regNumber || !name || !model || !type || !maxLoadCapacity || !acquisitionCost) {
      return res.status(400).json({ error: 'Please provide all required fields' });
    }

    const regExists = await Vehicle.findOne({ regNumber: regNumber.toUpperCase() });
    if (regExists) {
      return res.status(400).json({ error: 'Vehicle with this registration number already exists' });
    }

    const vehicle = await Vehicle.create({
      regNumber: regNumber.toUpperCase(),
      name,
      model,
      type,
      maxLoadCapacity,
      odometer: odometer || 0,
      acquisitionCost,
      status: 'Available'
    });

    res.status(201).json(vehicle);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   PUT api/vehicles/:id
// @desc    Update vehicle details
router.put('/:id', protect, allowRoles(['fleet_manager']), async (req, res) => {
  try {
    const vehicle = await Vehicle.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    res.json(vehicle);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   GET api/vehicles/:id/cost-summary
// @desc    Get cost summary (fuel, maintenance, total) for a vehicle
router.get('/:id/cost-summary', protect, async (req, res) => {
  try {
    const vehicleId = req.params.id;
    const fuelLogs = await FuelLog.find({ vehicleId });
    const fuelCost = fuelLogs.reduce((sum, log) => sum + log.cost, 0);

    const maintenanceLogs = await Maintenance.find({ vehicleId });
    const maintenanceCost = maintenanceLogs.reduce((sum, log) => sum + log.cost, 0);

    res.json({
      fuelCost,
      maintenanceCost,
      totalCost: fuelCost + maintenanceCost
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
