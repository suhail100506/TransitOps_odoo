const express = require('express');
const Vehicle = require('../models/Vehicle');
const User = require('../models/User');
const Trip = require('../models/Trip');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/kpis', protect, async (req, res) => {
  try {
    const totalVehicles = await Vehicle.countDocuments({ status: { $ne: 'OUT_OF_SERVICE' } });
    const activeVehicles = await Vehicle.countDocuments({ status: 'DISPATCHED' });
    const availableVehicles = await Vehicle.countDocuments({ status: 'AVAILABLE' });
    const inMaintenance = await Vehicle.countDocuments({ status: 'UNDER_MAINTENANCE' });

    const activeTrips = await Trip.countDocuments({ currentStatus: { $in: ['DISPATCHED', 'IN_TRANSIT'] } });
    const pendingTrips = await Trip.countDocuments({ currentStatus: 'SCHEDULED' });

    const driversOnDuty = await User.countDocuments({ role: 'Driver', driverStatus: 'On Trip' });

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
