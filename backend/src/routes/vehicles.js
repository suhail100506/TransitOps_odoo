const express = require('express');
const Vehicle = require('../models/Vehicle');
const FuelLog = require('../models/FuelLog');
const MaintenanceTicket = require('../models/MaintenanceTicket');
const MaintenanceLog = require('../models/MaintenanceLog');
const { protect } = require('../middleware/auth');
const authorize = require('../middleware/rbac');

const router = express.Router();

router.get('/', protect, async (req, res) => {
  try {
    const { status, type } = req.query;
    const query = {};
    if (status) {
      // Map Available -> AVAILABLE, etc.
      const s = status.toUpperCase();
      if (s === 'IN SHOP') query.status = 'UNDER_MAINTENANCE';
      else if (s === 'ON TRIP') query.status = 'DISPATCHED';
      else if (s === 'RETIRED') query.status = 'OUT_OF_SERVICE';
      else query.status = s;
    }
    if (type) query.type = type.toUpperCase();

    const vehicles = await Vehicle.find(query);
    res.json(vehicles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/available', protect, async (req, res) => {
  try {
    const vehicles = await Vehicle.find({ status: 'AVAILABLE' });
    res.json(vehicles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', protect, authorize('Admin', 'Dispatcher'), async (req, res) => {
  try {
    const { regNumber, registrationNumber, name, model, type, maxLoadCapacity, capacity, odometer, acquisitionCost } = req.body;

    const finalRegNumber = registrationNumber || regNumber;
    const finalType = type;
    const finalCapacity = capacity !== undefined ? capacity : maxLoadCapacity;

    if (!finalRegNumber || !name || !model || !finalType || finalCapacity === undefined || acquisitionCost === undefined) {
      return res.status(400).json({ error: 'Please provide all required fields' });
    }

    const regExists = await Vehicle.findOne({
      $or: [
        { registrationNumber: finalRegNumber.toUpperCase() },
        { regNumber: finalRegNumber.toUpperCase() }
      ]
    });
    
    if (regExists) {
      return res.status(400).json({ error: 'Vehicle with this registration number already exists' });
    }

    const vehicle = await Vehicle.create({
      registrationNumber: finalRegNumber.toUpperCase(),
      name,
      model,
      type: finalType,
      capacity: finalCapacity,
      odometer: odometer || 0,
      acquisitionCost,
      status: 'AVAILABLE'
    });

    res.status(201).json(vehicle);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', protect, authorize('Admin', 'Dispatcher'), async (req, res) => {
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

router.get('/:id/cost-summary', protect, async (req, res) => {
  try {
    const vehicleId = req.params.id;
    const fuelLogs = await FuelLog.find({ vehicleId });
    const fuelCost = fuelLogs.reduce((sum, log) => sum + log.cost, 0);

    const tickets = await MaintenanceTicket.find({ vehicleId });
    const ticketIds = tickets.map(t => t._id);
    const maintenanceLogs = await MaintenanceLog.find({ ticketId: { $in: ticketIds } });
    const maintenanceCost = maintenanceLogs.reduce((sum, log) => sum + (log.cost || 0), 0);

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
