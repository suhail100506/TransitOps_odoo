const express = require('express');
const FuelLog = require('../models/FuelLog');
const Vehicle = require('../models/Vehicle');
const { protect, allowRoles } = require('../middleware/auth');

const router = express.Router();

// @route   POST api/fuel-logs
// @desc    Log fuel intake for a vehicle
router.post('/', protect, allowRoles(['financial_analyst', 'fleet_manager']), async (req, res) => {
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
// @desc    Get all fuel logs with optional filters
router.get('/', protect, allowRoles(['financial_analyst', 'fleet_manager']), async (req, res) => {
  try {
    const { type, status, vehicleId } = req.query;
    
    // Build vehicle query if filters provided
    let vehicleIds = null;
    if (type || status) {
      const vQuery = {};
      if (type) vQuery.type = type;
      if (status) vQuery.status = status;
      
      const vehicles = await Vehicle.find(vQuery).select('_id');
      vehicleIds = vehicles.map(v => v._id);
    }
    
    // Build fuel log query
    const fQuery = {};
    if (vehicleId) {
      fQuery.vehicleId = vehicleId;
    } else if (vehicleIds) {
      fQuery.vehicleId = { $in: vehicleIds };
    }
    
    const logs = await FuelLog.find(fQuery).populate('vehicleId').sort({ date: -1 });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   GET api/fuel-logs/:id
// @desc    Get a single fuel log
router.get('/:id', protect, allowRoles(['financial_analyst', 'fleet_manager']), async (req, res) => {
  try {
    const log = await FuelLog.findById(req.params.id).populate('vehicleId');
    if (!log) return res.status(404).json({ error: 'Fuel log not found' });
    res.json(log);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   PUT api/fuel-logs/:id
// @desc    Update a fuel log
router.put('/:id', protect, allowRoles(['financial_analyst', 'fleet_manager']), async (req, res) => {
  try {
    const { liters, cost, date } = req.body;
    const log = await FuelLog.findById(req.params.id);
    
    if (!log) return res.status(404).json({ error: 'Fuel log not found' });
    
    if (liters) log.liters = liters;
    if (cost) log.cost = cost;
    if (date) log.date = date;
    
    await log.save();
    res.json(log);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   DELETE api/fuel-logs/:id
// @desc    Delete a fuel log
router.delete('/:id', protect, allowRoles(['financial_analyst', 'fleet_manager']), async (req, res) => {
  try {
    const log = await FuelLog.findByIdAndDelete(req.params.id);
    if (!log) return res.status(404).json({ error: 'Fuel log not found' });
    res.json({ message: 'Fuel log removed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   GET api/fuel-logs/cost/:vehicleId
// @desc    Auto-compute total operational cost (Fuel + Maintenance) for a specific vehicle
router.get('/cost/:vehicleId', protect, allowRoles(['financial_analyst', 'fleet_manager']), async (req, res) => {
  try {
    const { vehicleId } = req.params;
    
    // 1. Calculate Total Fuel Cost
    const fuelLogs = await FuelLog.find({ vehicleId });
    const totalFuelCost = fuelLogs.reduce((sum, log) => sum + log.cost, 0);
    const totalLiters = fuelLogs.reduce((sum, log) => sum + log.liters, 0);
    
    // 2. Calculate Total Maintenance Cost
    const Maintenance = require('../models/Maintenance');
    const maintenanceLogs = await Maintenance.find({ vehicleId });
    const totalMaintenanceCost = maintenanceLogs.reduce((sum, log) => sum + log.cost, 0);
    
    // 3. Compute Total Operational Cost
    const totalOperationalCost = totalFuelCost + totalMaintenanceCost;
    
    res.json({ 
      vehicleId, 
      totalOperationalCost,
      breakdown: {
        totalFuelCost, 
        totalMaintenanceCost,
        totalLiters 
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   GET api/fuel-logs/total-cost
// @desc    Auto-compute GLOBAL total operational cost (Fuel + Maintenance) across all vehicles
router.get('/total-cost', protect, allowRoles(['financial_analyst', 'fleet_manager']), async (req, res) => {
  try {
    const fuelLogs = await FuelLog.find({});
    const totalFuelCost = fuelLogs.reduce((sum, log) => sum + log.cost, 0);

    const Maintenance = require('../models/Maintenance');
    const maintenanceLogs = await Maintenance.find({});
    const totalMaintenanceCost = maintenanceLogs.reduce((sum, log) => sum + log.cost, 0);

    const totalOperationalCost = totalFuelCost + totalMaintenanceCost;

    res.json({
      totalOperationalCost,
      breakdown: {
        totalFuelCost,
        totalMaintenanceCost
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
