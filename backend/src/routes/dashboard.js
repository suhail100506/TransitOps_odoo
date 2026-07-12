const express = require('express');
const Vehicle = require('../models/Vehicle');
const Driver = require('../models/Driver');
const Trip = require('../models/Trip');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @route   GET api/dashboard/kpis
// @desc    Get dashboard metrics and fleet overview
router.get('/kpis', protect, async (req, res) => {
  try {
    const totalVehicles = await Vehicle.countDocuments({ status: { $ne: 'Retired' } });
    const activeVehicles = await Vehicle.countDocuments({ status: 'On Trip' });
    const availableVehicles = await Vehicle.countDocuments({ status: 'Available' });
    const inMaintenance = await Vehicle.countDocuments({ status: 'In Shop' });

    const activeTrips = await Trip.countDocuments({ status: 'Dispatched' });
    const pendingTrips = await Trip.countDocuments({ status: 'Draft' });

    const driversOnDuty = await Driver.countDocuments({ status: 'On Trip' });

    const fleetUtilization = totalVehicles > 0 
      ? Math.round((activeVehicles / totalVehicles) * 100) 
      : 0;

    res.json({
      activeVehicles,
      availableVehicles,
      inMaintenance,
      activeTrips,
      pendingTrips,
      driversOnDuty,
      fleetUtilization
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
