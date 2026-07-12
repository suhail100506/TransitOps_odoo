const mongoose = require('mongoose');
const MaintenanceTicket = require('../models/MaintenanceTicket');
const MaintenanceLog = require('../models/MaintenanceLog');
const MaintenanceSchedule = require('../models/MaintenanceSchedule');
const Vehicle = require('../models/Vehicle');
const { generateTicketCode } = require('../utils/generateCode');
const { isValidTicketTransition } = require('../utils/statusTransitions');

const createTicket = async (req, res) => {
  const { vehicleId, category, priority, description, cost } = req.body;

  if (!vehicleId || !category || !priority || !description) {
    return res.status(400).json({ success: false, error: 'VALIDATION_ERROR', message: 'Missing required ticket fields' });
  }

  const vehicle = await Vehicle.findById(vehicleId);
  if (!vehicle) {
    return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Vehicle not found' });
  }

  const code = await generateTicketCode();
  
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const ticket = await MaintenanceTicket.create([{
      ticketCode: code,
      vehicleId,
      category,
      priority,
      reportedBy: req.user._id,
      currentStatus: 'OPEN',
      description,
      lastSequence: 1
    }], { session });

    await MaintenanceLog.create([{
      ticketId: ticket[0]._id,
      status: 'OPEN',
      sequence: 1,
      changedBy: req.user._id,
      note: 'Ticket opened.',
      cost: cost || 0
    }], { session });

    if (priority === 'CRITICAL' || category === 'BREAKDOWN') {
      vehicle.status = 'UNDER_MAINTENANCE';
      vehicle.activeMaintenanceTicketId = ticket[0]._id;
      await vehicle.save({ session });
    }

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      data: ticket[0],
      message: 'Maintenance ticket logged successfully'
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(400).json({ success: false, error: 'TRANSACTION_FAILED', message: error.message });
  }
};

const listTickets = async (req, res) => {
  const { vehicleId, status, priority, dateFrom, dateTo, page = 1, limit = 10 } = req.query;
  const query = {};

  if (vehicleId) query.vehicleId = vehicleId;
  if (status) {
    const s = status.toUpperCase();
    if (s === 'IN PROGRESS') query.currentStatus = 'IN_PROGRESS';
    else query.currentStatus = s;
  }
  if (priority) query.priority = priority.toUpperCase();

  if (dateFrom || dateTo) {
    query.createdAt = {};
    if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
    if (dateTo) query.createdAt.$lte = new Date(dateTo);
  }

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  const totalCount = await MaintenanceTicket.countDocuments(query);
  const tickets = await MaintenanceTicket.find(query)
    .populate('vehicleId')
    .populate('reportedBy', 'name email role')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);

  const totalPages = Math.ceil(totalCount / limitNum);

  res.json({
    success: true,
    data: tickets,
    totalCount,
    page: pageNum,
    totalPages
  });
};

const getTicketDetails = async (req, res) => {
  const { id } = req.params;

  const ticket = await MaintenanceTicket.findById(id)
    .populate('vehicleId')
    .populate('reportedBy', 'name email role');
    
  if (!ticket) {
    return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Ticket not found' });
  }

  const history = await MaintenanceLog.find({ ticketId: id })
    .populate('changedBy', 'name email role')
    .sort({ sequence: 1 });

  res.json({
    success: true,
    data: {
      ticket,
      history
    }
  });
};

const changeTicketStatus = async (req, res) => {
  const { status, note, cost } = req.body;
  const { id } = req.params;

  const ticket = await MaintenanceTicket.findById(id);
  if (!ticket) {
    return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Ticket not found' });
  }

  const targetStatus = status.toUpperCase();
  const currentStatus = ticket.currentStatus;

  if (!isValidTicketTransition(currentStatus, targetStatus)) {
    return res.status(400).json({
      success: false,
      error: 'INVALID_TRANSITION',
      message: `Cannot transition ticket status from ${currentStatus} to ${targetStatus}`
    });
  }

  if (targetStatus === 'CLOSED' && currentStatus !== 'RESOLVED') {
    return res.status(400).json({
      success: false,
      error: 'TWO_STEP_CLOSE_REQUIRED',
      message: 'Ticket must be RESOLVED before it can be CLOSED.'
    });
  }

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const nextSequence = ticket.lastSequence + 1;

    await MaintenanceLog.create([{
      ticketId: ticket._id,
      status: targetStatus,
      sequence: nextSequence,
      changedBy: req.user._id,
      note: note || `Status updated to ${targetStatus}`,
      cost: cost || 0
    }], { session });

    ticket.currentStatus = targetStatus;
    ticket.lastSequence = nextSequence;
    await ticket.save({ session });

    const vehicle = await Vehicle.findById(ticket.vehicleId);
    if (vehicle) {
      if (targetStatus === 'CLOSED') {
        const otherOpenCount = await MaintenanceTicket.countDocuments({
          vehicleId: vehicle._id,
          currentStatus: { $ne: 'CLOSED' },
          _id: { $ne: ticket._id }
        });
        
        if (otherOpenCount === 0) {
          vehicle.status = 'AVAILABLE';
          vehicle.activeMaintenanceTicketId = null;
          await vehicle.save({ session });
        }
      }
    }

    await session.commitTransaction();
    session.endSession();

    res.json({
      success: true,
      data: ticket,
      message: `Ticket status updated to ${targetStatus} successfully`
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(400).json({ success: false, error: 'TRANSACTION_FAILED', message: error.message });
  }
};

const createSchedule = async (req, res) => {
  const { vehicleId, scheduleType, dueDate, dueMileage } = req.body;

  if (!vehicleId || !scheduleType) {
    return res.status(400).json({ success: false, error: 'VALIDATION_ERROR', message: 'Missing vehicle ID or schedule type' });
  }

  const schedule = await MaintenanceSchedule.create({
    vehicleId,
    scheduleType,
    dueDate: dueDate ? new Date(dueDate) : null,
    dueMileage,
    status: 'UPCOMING'
  });

  res.status(201).json({
    success: true,
    data: schedule,
    message: 'Preventive maintenance schedule created'
  });
};

const listSchedules = async (req, res) => {
  const schedules = await MaintenanceSchedule.find({
    status: { $in: ['UPCOMING', 'DUE', 'OVERDUE'] }
  }).populate('vehicleId');

  res.json({
    success: true,
    data: schedules
  });
};

const getVehicleMaintenanceHistory = async (req, res) => {
  const { vehicleId } = req.params;

  const tickets = await MaintenanceTicket.find({ vehicleId }).populate('reportedBy', 'name email role').sort({ createdAt: -1 });

  const history = [];
  for (const ticket of tickets) {
    const logs = await MaintenanceLog.find({ ticketId: ticket._id }).populate('changedBy', 'name email role').sort({ sequence: 1 });
    history.push({
      ticket,
      logs
    });
  }

  res.json({
    success: true,
    data: history
  });
};

const getVehicleAvailability = async (req, res) => {
  const { vehicleId } = req.params;
  const vehicle = await Vehicle.findById(vehicleId);
  
  if (!vehicle) {
    return res.status(404).json({ success: false, error: 'NOT_FOUND', message: 'Vehicle not found' });
  }

  const isBlocked = vehicle.status !== 'AVAILABLE';
  const reason = isBlocked ? `Vehicle status is ${vehicle.status}` : 'Vehicle is available';

  res.json({
    success: true,
    data: {
      vehicleId,
      isBlocked,
      status: vehicle.status,
      reason
    }
  });
};

module.exports = {
  createTicket,
  listTickets,
  getTicketDetails,
  changeTicketStatus,
  createSchedule,
  listSchedules,
  getVehicleMaintenanceHistory,
  getVehicleAvailability
};
