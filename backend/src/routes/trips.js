const express = require('express');
const Trip = require('../models/Trip');
const Vehicle = require('../models/Vehicle');
const Driver = require('../models/Driver');
const Maintenance = require('../models/Maintenance');
const { protect, allowRoles } = require('../middleware/auth');

const router = express.Router();

// @route   GET api/trips
// @desc    Get all trips with query filters
router.get('/', protect, async (req, res) => {
  try {
    const { status } = req.query;
    const query = {};
    if (status) query.status = status;

    const trips = await Trip.find(query)
      .populate('vehicleId')
      .populate('driverId')
      .sort({ createdAt: -1 });
    res.json(trips);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   POST api/trips
// @desc    Create a new trip (Draft)
router.post('/', protect, allowRoles(['driver', 'fleet_manager']), async (req, res) => {
  try {
    const { source, destination, vehicleId, driverId, cargoWeight, plannedDistance } = req.body;

    if (!source || !destination || !vehicleId || !driverId || !cargoWeight || !plannedDistance) {
      return res.status(400).json({ error: 'Please provide all required fields' });
    }

    // Fetch vehicle and driver
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    const driver = await Driver.findById(driverId);
    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    // Business rule: cargoWeight <= vehicle.maxLoadCapacity
    if (cargoWeight > vehicle.maxLoadCapacity) {
      return res.status(400).json({
        error: `Cargo weight (${cargoWeight} kg) exceeds vehicle maximum capacity (${vehicle.maxLoadCapacity} kg)`
      });
    }

    // Business rule: vehicle status is not In Shop/Retired/On Trip
    if (['In Shop', 'Retired', 'On Trip'].includes(vehicle.status)) {
      return res.status(400).json({
        error: `Vehicle is not available for a new trip (Status: ${vehicle.status})`
      });
    }

    // Business rule: driver status is Available and not Suspended
    if (driver.status !== 'Available') {
      return res.status(400).json({
        error: `Driver is not available (Status: ${driver.status})`
      });
    }

    if (driver.status === 'Suspended') {
      return res.status(400).json({
        error: 'Driver is Suspended'
      });
    }

    // Business rule: driver license expiry check
    const today = new Date();
    if (new Date(driver.licenseExpiryDate) <= today) {
      return res.status(400).json({
        error: 'Driver license has expired'
      });
    }

    const trip = await Trip.create({
      source,
      destination,
      vehicleId,
      driverId,
      cargoWeight,
      plannedDistance,
      status: 'Draft'
    });

    res.status(201).json(trip);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   POST api/trips/:id/dispatch
// @desc    Dispatch a trip (Start journey)
router.post('/:id/dispatch', protect, allowRoles(['driver', 'fleet_manager']), async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    if (trip.status !== 'Draft') {
      return res.status(400).json({ error: `Cannot dispatch a trip in status: ${trip.status}` });
    }

    const vehicle = await Vehicle.findById(trip.vehicleId);
    const driver = await Driver.findById(trip.driverId);

    if (!vehicle || !driver) {
      return res.status(404).json({ error: 'Vehicle or Driver not found for this trip' });
    }

    // Business Rule: vehicle and driver must be Available
    if (vehicle.status !== 'Available') {
      return res.status(400).json({ error: `Vehicle is currently unavailable (Status: ${vehicle.status})` });
    }
    if (driver.status !== 'Available') {
      return res.status(400).json({ error: `Driver is currently unavailable (Status: ${driver.status})` });
    }

    // Business Rule: license must not be expired
    const today = new Date();
    if (new Date(driver.licenseExpiryDate) <= today) {
      return res.status(400).json({ error: `Driver license is expired. Expiry: ${driver.licenseExpiryDate.toDateString()}` });
    }

    // Cascade update statuses
    vehicle.status = 'On Trip';
    driver.status = 'On Trip';
    await vehicle.save();
    await driver.save();

    trip.status = 'Dispatched';
    trip.dispatchedAt = new Date();
    await trip.save();

    res.json(trip);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   POST api/trips/:id/complete
// @desc    Complete a trip (requires fuel and odometer logs)
router.post('/:id/complete', protect, allowRoles(['driver', 'fleet_manager']), async (req, res) => {
  try {
    const { finalOdometer, fuelConsumed } = req.body;

    if (finalOdometer === undefined || fuelConsumed === undefined) {
      return res.status(400).json({ error: 'Please provide final odometer and fuel consumed' });
    }

    const trip = await Trip.findById(req.params.id);
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    if (trip.status !== 'Dispatched') {
      return res.status(400).json({ error: `Cannot complete a trip in status: ${trip.status}` });
    }

    const vehicle = await Vehicle.findById(trip.vehicleId);
    const driver = await Driver.findById(trip.driverId);

    if (!vehicle || !driver) {
      return res.status(404).json({ error: 'Vehicle or Driver not found' });
    }

    // Validate odometer makes sense
    if (finalOdometer < vehicle.odometer) {
      return res.status(400).json({
        error: `Final odometer (${finalOdometer} km) cannot be less than vehicle's current odometer (${vehicle.odometer} km)`
      });
    }

    // Calculate actual distance
    const actualDistance = finalOdometer - vehicle.odometer;

    // Check if odometer crossed a 10,000 km milestone (10k, 20k, 30k, etc.)
    const milestoneBefore = Math.floor(vehicle.odometer / 10000);
    const milestoneAfter = Math.floor(finalOdometer / 10000);
    const crossedMilestone = milestoneAfter > milestoneBefore && milestoneAfter > 0;

    // Update vehicle odometer and status
    vehicle.odometer = finalOdometer;
    if (crossedMilestone) {
      vehicle.status = 'In Shop';
    } else {
      vehicle.status = 'Available';
    }
    await vehicle.save();

    // Update driver status
    driver.status = 'Available';
    await driver.save();

    // Update trip details
    trip.status = 'Completed';
    trip.actualDistance = actualDistance;
    trip.fuelConsumed = fuelConsumed;
    trip.completedAt = new Date();
    await trip.save();

    // If milestone crossed, automatically trigger an Open maintenance ticket
    if (crossedMilestone) {
      await Maintenance.create({
        vehicleId: vehicle._id,
        description: `Automated Preventive Maintenance Alert (Odometer crossed ${milestoneAfter * 10000} km milestone)`,
        cost: 0,
        status: 'Open'
      });
    }

    res.json(trip);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   POST api/trips/:id/cancel
// @desc    Cancel a trip (releases vehicle/driver if dispatched)
router.post('/:id/cancel', protect, allowRoles(['driver', 'fleet_manager']), async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    if (['Completed', 'Cancelled'].includes(trip.status)) {
      return res.status(400).json({ error: `Cannot cancel a trip that is already ${trip.status}` });
    }

    // Release vehicle and driver if they were dispatched
    if (trip.status === 'Dispatched') {
      const vehicle = await Vehicle.findById(trip.vehicleId);
      const driver = await Driver.findById(trip.driverId);

      if (vehicle && vehicle.status === 'On Trip') {
        vehicle.status = 'Available';
        await vehicle.save();
      }
      if (driver && driver.status === 'On Trip') {
        driver.status = 'Available';
        await driver.save();
      }
    }

    trip.status = 'Cancelled';
    await trip.save();

    res.json(trip);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
