const mongoose = require('mongoose');
const Trip = require('../models/Trip');
const TripStatusHistory = require('../models/TripStatusHistory');
const Vehicle = require('../models/Vehicle');
const User = require('../models/User');
const { generateTripCode } = require('../utils/generateCode');
const { isValidTripTransition } = require('../utils/statusTransitions');

const checkOverlap = async (vehicleId, driverId, scheduledDeparture, scheduledArrival, excludeTripId = null) => {
  const query = {
    currentStatus: { $ne: 'CANCELLED' },
    $or: [
      { vehicleId },
      { driverId }
    ],
    scheduledDeparture: { $lt: new Date(scheduledArrival) },
    scheduledArrival: { $gt: new Date(scheduledDeparture) }
  };
  
  if (excludeTripId) {
    query._id = { $ne: excludeTripId };
  }

  return await Trip.findOne(query);
};

const createTrip = async (req, res) => {
  const { source, destination, origin, destinationObj, routeName, scheduledDeparture, scheduledArrival, vehicleId, driverId, cargoWeight, plannedDistance } = req.body;

  if (!scheduledDeparture || !scheduledArrival || !vehicleId || !driverId || cargoWeight === undefined || plannedDistance === undefined) {
    return res.status(400).json({ success: false, error: 'VALIDATION_ERROR', message: 'Missing required trip parameters' });
  }

  const overlap = await checkOverlap(vehicleId, driverId, scheduledDeparture, scheduledArrival);
  if (overlap) {
    return res.status(400).json({
      success: false,
      error: 'SCHEDULING_OVERLAP',
      message: 'Vehicle or Driver is already assigned to another trip during this window.'
    });
  }

  const vehicle = await Vehicle.findById(vehicleId);
  if (!vehicle) {
    return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Vehicle not found' });
  }
  if (vehicle.status !== 'AVAILABLE') {
    return res.status(400).json({
      success: false,
      error: 'VEHICLE_UNAVAILABLE',
      message: `Vehicle is not available (Current Status: ${vehicle.status})`
    });
  }

  const capacity = vehicle.capacity || vehicle.maxLoadCapacity || 0;
  if (cargoWeight > capacity) {
    return res.status(400).json({
      success: false,
      error: 'OVERWEIGHT',
      message: `Cargo weight (${cargoWeight} kg) exceeds vehicle capacity (${capacity} kg)`
    });
  }

  const tripCode = await generateTripCode();
  const tripOrigin = origin || { name: source, lat: 0, lng: 0 };
  const tripDest = destinationObj || { name: destination, lat: 0, lng: 0 };

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const trip = await Trip.create([{
      tripCode,
      routeName: routeName || `${tripOrigin.name} to ${tripDest.name}`,
      origin: tripOrigin,
      destination: tripDest,
      scheduledDeparture,
      scheduledArrival,
      vehicleId,
      driverId,
      dispatchedBy: req.user._id,
      currentStatus: 'SCHEDULED',
      cargoWeight,
      plannedDistance,
      lastSequence: 1
    }], { session });

    await TripStatusHistory.create([{
      tripId: trip[0]._id,
      status: 'SCHEDULED',
      sequence: 1,
      changedBy: req.user._id,
      note: 'Trip scheduled.'
    }], { session });

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      data: trip[0],
      message: 'Trip created successfully'
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(400).json({ success: false, error: 'TRANSACTION_FAILED', message: error.message });
  }
};

const listTrips = async (req, res) => {
  const { status, vehicleId, driverId, dateFrom, dateTo, page = 1, limit = 10 } = req.query;
  const query = {};

  if (status) {
    // Map legacy query strings like 'Dispatched' to 'DISPATCHED' etc.
    const s = status.toUpperCase();
    if (s === 'IN TRANSIT') query.currentStatus = 'IN_TRANSIT';
    else query.currentStatus = s;
  }
  if (vehicleId) query.vehicleId = vehicleId;
  if (driverId) query.driverId = driverId;

  if (dateFrom || dateTo) {
    query.scheduledDeparture = {};
    if (dateFrom) query.scheduledDeparture.$gte = new Date(dateFrom);
    if (dateTo) query.scheduledDeparture.$lte = new Date(dateTo);
  }

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  const totalCount = await Trip.countDocuments(query);
  const trips = await Trip.find(query)
    .populate('vehicleId')
    .populate('driverId')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);

  const totalPages = Math.ceil(totalCount / limitNum);

  res.json({
    success: true,
    data: trips,
    totalCount,
    page: pageNum,
    totalPages
  });
};

const getTripDetails = async (req, res) => {
  const { id } = req.params;

  const trip = await Trip.findById(id).populate('vehicleId').populate('driverId');
  if (!trip) {
    return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Trip not found' });
  }

  if (req.user.role === 'Driver' && trip.driverId._id.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      error: 'FORBIDDEN',
      message: 'Drivers can only view their own assigned trips.'
    });
  }

  const history = await TripStatusHistory.find({ tripId: id }).populate('changedBy', 'name email role').sort({ sequence: 1 });

  res.json({
    success: true,
    data: {
      trip,
      history
    }
  });
};

const assignVehicleAndDriver = async (req, res) => {
  const { id } = req.params;
  const { vehicleId, driverId } = req.body;

  const trip = await Trip.findById(id);
  if (!trip) {
    return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Trip not found' });
  }

  if (trip.currentStatus !== 'SCHEDULED') {
    return res.status(400).json({
      success: false,
      error: 'INVALID_STATE',
      message: 'Vehicle and Driver can only be assigned to a scheduled trip.'
    });
  }

  const overlap = await checkOverlap(vehicleId, driverId, trip.scheduledDeparture, trip.scheduledArrival, trip._id);
  if (overlap) {
    return res.status(400).json({
      success: false,
      error: 'SCHEDULING_OVERLAP',
      message: 'Vehicle or Driver is already assigned to another trip during this window.'
    });
  }

  const vehicle = await Vehicle.findById(vehicleId);
  if (!vehicle) {
    return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Vehicle not found' });
  }
  if (vehicle.status !== 'AVAILABLE') {
    return res.status(400).json({
      success: false,
      error: 'VEHICLE_UNAVAILABLE',
      message: `Vehicle is not available (Current Status: ${vehicle.status})`
    });
  }

  trip.vehicleId = vehicleId;
  trip.driverId = driverId;
  await trip.save();

  res.json({
    success: true,
    data: trip,
    message: 'Vehicle and Driver assigned successfully'
  });
};

const changeTripStatus = async (req, res) => {
  const { status, note, location, finalOdometer, fuelConsumed } = req.body;
  const { id } = req.params;

  const trip = await Trip.findById(id);
  if (!trip) {
    return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Trip not found' });
  }

  if (req.user.role === 'Driver' && trip.driverId.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      error: 'FORBIDDEN',
      message: 'Drivers can only update their own assigned trips.'
    });
  }

  const targetStatus = status.toUpperCase();
  if (!isValidTripTransition(trip.currentStatus, targetStatus)) {
    return res.status(400).json({
      success: false,
      error: 'INVALID_TRANSITION',
      message: `Cannot transition trip status from ${trip.currentStatus} to ${targetStatus}`
    });
  }

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const nextSequence = trip.lastSequence + 1;

    await TripStatusHistory.create([{
      tripId: trip._id,
      status: targetStatus,
      sequence: nextSequence,
      changedBy: req.user._id,
      note: note || `Status updated to ${targetStatus}`,
      location
    }], { session });

    trip.currentStatus = targetStatus;
    trip.lastSequence = nextSequence;

    const vehicle = await Vehicle.findById(trip.vehicleId);
    const driver = await User.findById(trip.driverId);

    if (targetStatus === 'DISPATCHED') {
      trip.dispatchedAt = new Date();
      if (vehicle) {
        vehicle.status = 'DISPATCHED';
        await vehicle.save({ session });
      }
      if (driver) {
        driver.driverStatus = 'On Trip';
        await driver.save({ session });
      }
    } else if (targetStatus === 'COMPLETED') {
      trip.completedAt = new Date();
      if (finalOdometer !== undefined && vehicle) {
        if (finalOdometer < vehicle.odometer) {
          throw new Error(`Final odometer (${finalOdometer} km) cannot be less than vehicle's current odometer (${vehicle.odometer} km)`);
        }
        trip.actualDistance = finalOdometer - vehicle.odometer;
        vehicle.odometer = finalOdometer;
      }
      if (fuelConsumed !== undefined) {
        trip.fuelConsumed = fuelConsumed;
      }

      if (vehicle) {
        if (vehicle.status !== 'OUT_OF_SERVICE' && vehicle.status !== 'UNDER_MAINTENANCE') {
          vehicle.status = 'AVAILABLE';
        }
        await vehicle.save({ session });
      }
      if (driver) {
        driver.driverStatus = 'Available';
        await driver.save({ session });
      }
    } else if (targetStatus === 'CANCELLED') {
      if (vehicle) {
        if (vehicle.status !== 'OUT_OF_SERVICE' && vehicle.status !== 'UNDER_MAINTENANCE') {
          vehicle.status = 'AVAILABLE';
        }
        await vehicle.save({ session });
      }
      if (driver) {
        driver.driverStatus = 'Available';
        await driver.save({ session });
      }
    }

    await trip.save({ session });
    await session.commitTransaction();
    session.endSession();

    res.json({
      success: true,
      data: trip,
      message: `Trip status updated to ${targetStatus} successfully`
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    return res.status(400).json({
      success: false,
      error: 'TRANSACTION_FAILED',
      message: error.message
    });
  }
};

const getDispatchBoard = async (req, res) => {
  const activeStatuses = ["SCHEDULED", "DISPATCHED", "IN_TRANSIT", "DELAYED"];
  const trips = await Trip.find({ currentStatus: { $in: activeStatuses } })
    .populate('vehicleId')
    .populate('driverId');

  const board = {
    SCHEDULED: [],
    DISPATCHED: [],
    IN_TRANSIT: [],
    DELAYED: []
  };

  trips.forEach(trip => {
    if (board[trip.currentStatus]) {
      board[trip.currentStatus].push(trip);
    }
  });

  res.json({
    success: true,
    data: board
  });
};

const getDriverTrips = async (req, res) => {
  const { driverId } = req.params;

  if (req.user.role === 'Driver' && req.user._id.toString() !== driverId) {
    return res.status(403).json({
      success: false,
      error: 'FORBIDDEN',
      message: 'Drivers can only access their own trip log.'
    });
  }

  const trips = await Trip.find({ driverId }).populate('vehicleId').populate('driverId').sort({ createdAt: -1 });

  res.json({
    success: true,
    data: trips
  });
};

module.exports = {
  createTrip,
  listTrips,
  getTripDetails,
  assignVehicleAndDriver,
  changeTripStatus,
  getDispatchBoard,
  getDriverTrips
};
