const express = require('express');
const Vehicle = require('../models/Vehicle');
const FuelLog = require('../models/FuelLog');
const Maintenance = require('../models/Maintenance');
const { protect, allowRoles } = require('../middleware/auth');

const router = express.Router();

// @route   GET api/vehicles/available
// @desc    Get available vehicles only
// NOTE: must be before /:id to avoid route conflict
router.get('/available', protect, async (req, res) => {
  try {
    const vehicles = await Vehicle.find({ status: 'Available' });
    res.json(vehicles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   GET api/vehicles
// @desc    Get all vehicles (with query filters and sorting)
router.get('/', protect, async (req, res) => {
  try {
    const { status, type, sort } = req.query;
    const query = {};
    if (status) query.status = status;
    if (type) query.type = type;

    // Support sort by odometer or createdAt (default: newest first)
    const sortOption = sort === 'odometer'
      ? { odometer: -1 }
      : { createdAt: -1 };

    const vehicles = await Vehicle.find(query).sort(sortOption);
    res.json(vehicles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   GET api/vehicles/:id
// @desc    Get a single vehicle by ID
router.get('/:id', protect, async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }
    res.json(vehicle);
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

// @route   PATCH api/vehicles/:id/retire
// @desc    Retire a vehicle (sets status to Retired)
router.patch('/:id/retire', protect, allowRoles(['fleet_manager']), async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    if (vehicle.status === 'On Trip') {
      return res.status(400).json({
        error: 'Cannot retire a vehicle that is currently On Trip. Complete or cancel the active trip first.'
      });
    }

    if (vehicle.status === 'In Shop') {
      // Check for open maintenance records
      const openMaintenance = await Maintenance.findOne({
        vehicleId: vehicle._id,
        status: 'Open'
      });
      if (openMaintenance) {
        return res.status(400).json({
          error: 'Cannot retire a vehicle with an open maintenance record. Close the maintenance ticket first.'
        });
      }
    }

    if (vehicle.status === 'Retired') {
      return res.status(400).json({ error: 'Vehicle is already retired.' });
    }

    vehicle.status = 'Retired';
    await vehicle.save();

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
      fuelCost: parseFloat(fuelCost.toFixed(2)),
      maintenanceCost: parseFloat(maintenanceCost.toFixed(2)),
      totalCost: parseFloat((fuelCost + maintenanceCost).toFixed(2))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
