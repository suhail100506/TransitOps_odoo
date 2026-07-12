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
    const today = new Date();
    const in30Days = new Date();
    in30Days.setDate(in30Days.getDate() + 30);

    // Vehicle counts
    const totalVehicles = await Vehicle.countDocuments({ status: { $ne: 'Retired' } });
    const activeVehicles = await Vehicle.countDocuments({ status: 'On Trip' });
    const availableVehicles = await Vehicle.countDocuments({ status: 'Available' });
    const inMaintenance = await Vehicle.countDocuments({ status: 'In Shop' });

    // Trip counts
    const activeTrips = await Trip.countDocuments({ status: 'Dispatched' });
    const pendingTrips = await Trip.countDocuments({ status: 'Draft' });
    const completedTrips = await Trip.countDocuments({ status: 'Completed' });

    // Driver counts
    const driversOnDuty = await Driver.countDocuments({ status: 'On Trip' });

    // Expiring licenses (within 30 days, not yet expired)
    const expiringLicenses = await Driver.countDocuments({
      licenseExpiryDate: { $gt: today, $lte: in30Days },
      status: { $ne: 'Suspended' }
    });

    // Fleet utilization percentage
    const fleetUtilization = totalVehicles > 0
      ? Math.round((activeVehicles / totalVehicles) * 100)
      : 0;

    // Average fuel efficiency across all completed trips (km/L)
    const completedTripDocs = await Trip.find({
      status: 'Completed',
      fuelConsumed: { $gt: 0 },
      actualDistance: { $gt: 0 }
    }).select('actualDistance fuelConsumed');

    let avgFuelEfficiency = 0;
    if (completedTripDocs.length > 0) {
      const totalDist = completedTripDocs.reduce((s, t) => s + t.actualDistance, 0);
      const totalFuel = completedTripDocs.reduce((s, t) => s + t.fuelConsumed, 0);
      avgFuelEfficiency = totalFuel > 0
        ? parseFloat((totalDist / totalFuel).toFixed(2))
        : 0;
    }

    res.json({
      activeVehicles,
      availableVehicles,
      inMaintenance,
      activeTrips,
      pendingTrips,
      completedTrips,
      driversOnDuty,
      fleetUtilization,
      avgFuelEfficiency,
      expiringLicenses
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
