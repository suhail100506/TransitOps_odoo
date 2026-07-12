const mongoose = require('mongoose');
const Trip = require('../models/Trip');
const Vehicle = require('../models/Vehicle');
const User = require('../models/User');
const MaintenanceTicket = require('../models/MaintenanceTicket');
const MaintenanceLog = require('../models/MaintenanceLog');
const MaintenanceSchedule = require('../models/MaintenanceSchedule');
const { exportToCsvOrXlsx, exportToPdf } = require('../utils/exportReport');

let dashboardCache = null;
let dashboardCacheExpiry = 0;

const getDashboardKPIs = async (req, res) => {
  const now = Date.now();
  if (dashboardCache && now < dashboardCacheExpiry) {
    return res.json({ success: true, data: dashboardCache });
  }

  try {
    const totalVehicles = await Vehicle.countDocuments({ status: { $ne: 'OUT_OF_SERVICE' } });
    const activeVehicles = await Vehicle.countDocuments({ status: 'DISPATCHED' });
    const availableVehicles = await Vehicle.countDocuments({ status: 'AVAILABLE' });
    const inMaintenance = await Vehicle.countDocuments({ status: 'UNDER_MAINTENANCE' });
    
    const activeTrips = await Trip.countDocuments({ currentStatus: { $in: ['DISPATCHED', 'IN_TRANSIT'] } });
    const pendingTrips = await Trip.countDocuments({ currentStatus: { $in: ['SCHEDULED', 'DELAYED'] } });
    const driversOnDuty = await User.countDocuments({ role: 'Driver', driverStatus: 'On Trip' });

    const totalTrips = await Trip.countDocuments({});
    const completedTrips = await Trip.countDocuments({ currentStatus: 'COMPLETED' });
    const completionRate = totalTrips > 0 ? ((completedTrips / totalTrips) * 100).toFixed(1) : 0;
    const fleetUtilization = totalVehicles > 0 ? ((activeVehicles / totalVehicles) * 100).toFixed(1) : 0;

    const openMaintenance = await MaintenanceTicket.countDocuments({ currentStatus: { $ne: 'CLOSED' } });
    const overdueSchedules = await MaintenanceSchedule.countDocuments({ status: 'OVERDUE' });

    const kpis = {
      activeVehicles,
      availableVehicles,
      inMaintenance,
      activeTrips,
      pendingTrips,
      driversOnDuty,
      fleetUtilization,
      completionRate,
      openMaintenance,
      overdueSchedules,
      totalVehicles
    };

    dashboardCache = kpis;
    dashboardCacheExpiry = now + 60000; // 60s cache

    res.json({ success: true, data: kpis });
  } catch (error) {
    res.status(500).json({ success: false, error: 'SERVER_ERROR', message: error.message });
  }
};

const getTripSummaryReport = async (req, res) => {
  const { dateFrom, dateTo } = req.query;
  const matchQuery = {};

  if (dateFrom || dateTo) {
    matchQuery.scheduledDeparture = {};
    if (dateFrom) matchQuery.scheduledDeparture.$gte = new Date(dateFrom);
    if (dateTo) matchQuery.scheduledDeparture.$lte = new Date(dateTo);
  }

  try {
    const summary = await Trip.aggregate([
      { $match: matchQuery },
      { $group: { _id: "$currentStatus", count: { $sum: 1 } } }
    ]);

    res.json({ success: true, data: summary });
  } catch (error) {
    res.status(500).json({ success: false, error: 'SERVER_ERROR', message: error.message });
  }
};

const getOnTimePerformanceReport = async (req, res) => {
  try {
    const completedTrips = await Trip.find({ currentStatus: 'COMPLETED' });
    let onTime = 0;
    let delayed = 0;

    completedTrips.forEach(trip => {
      if (trip.completedAt && trip.scheduledArrival && trip.completedAt <= trip.scheduledArrival) {
        onTime++;
      } else {
        delayed++;
      }
    });

    const total = onTime + delayed;
    const otpPercent = total > 0 ? ((onTime / total) * 100).toFixed(1) : 100;

    res.json({
      success: true,
      data: {
        total,
        onTime,
        delayed,
        otpPercent: parseFloat(otpPercent)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'SERVER_ERROR', message: error.message });
  }
};

const getVehicleUtilizationReport = async (req, res) => {
  const { dateFrom, dateTo } = req.query;
  const matchQuery = { currentStatus: 'COMPLETED' };

  if (dateFrom || dateTo) {
    matchQuery.scheduledDeparture = {};
    if (dateFrom) matchQuery.scheduledDeparture.$gte = new Date(dateFrom);
    if (dateTo) matchQuery.scheduledDeparture.$lte = new Date(dateTo);
  }

  try {
    const utilization = await Trip.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: "$vehicleId",
          totalTrips: { $sum: 1 },
          totalMinutes: {
            $sum: { $divide: [{ $subtract: ["$scheduledArrival", "$scheduledDeparture"] }, 60000] }
          }
        }
      },
      { $lookup: { from: "vehicles", localField: "_id", foreignField: "_id", as: "vehicle" } },
      { $unwind: "$vehicle" },
      { $sort: { totalTrips: -1 } }
    ]);

    res.json({ success: true, data: utilization });
  } catch (error) {
    res.status(500).json({ success: false, error: 'SERVER_ERROR', message: error.message });
  }
};

const getDriverPerformanceReport = async (req, res) => {
  try {
    const performance = await Trip.aggregate([
      {
        $group: {
          _id: "$driverId",
          totalTrips: { $sum: 1 },
          completedTrips: {
            $sum: { $cond: [{ $eq: ["$currentStatus", "COMPLETED"] }, 1, 0] }
          },
          cancelledTrips: {
            $sum: { $cond: [{ $eq: ["$currentStatus", "CANCELLED"] }, 1, 0] }
          }
        }
      },
      { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "driver" } },
      { $unwind: "$driver" },
      { $sort: { totalTrips: -1 } }
    ]);

    res.json({ success: true, data: performance });
  } catch (error) {
    res.status(500).json({ success: false, error: 'SERVER_ERROR', message: error.message });
  }
};

const getMaintenanceSummaryReport = async (req, res) => {
  try {
    const summary = await MaintenanceTicket.aggregate([
      {
        $group: {
          _id: { category: "$category", status: "$currentStatus" },
          count: { $sum: 1 }
        }
      }
    ]);

    const totalCost = await MaintenanceLog.aggregate([
      { $group: { _id: null, total: { $sum: "$cost" } } }
    ]);

    res.json({
      success: true,
      data: {
        summary,
        totalCost: totalCost[0]?.total || 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'SERVER_ERROR', message: error.message });
  }
};

const getMaintenanceCostTrend = async (req, res) => {
  try {
    const trend = await MaintenanceLog.aggregate([
      { $match: { cost: { $gt: 0 } } },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          totalCost: { $sum: "$cost" }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    res.json({ success: true, data: trend });
  } catch (error) {
    res.status(500).json({ success: false, error: 'SERVER_ERROR', message: error.message });
  }
};

const exportReport = async (req, res) => {
  const { type = 'roi', format = 'csv' } = req.query;

  try {
    let title = "TransitOps Report";
    let headers = [];
    let rows = [];

    if (type === 'roi') {
      title = "Fleet ROI Summary Report";
      headers = ['Vehicle', 'Reg Number', 'Revenue ($)', 'Fuel Cost ($)', 'Maintenance Cost ($)', 'Acquisition Cost ($)', 'ROI (%)'];
      
      const vehicles = await Vehicle.find({ status: { $ne: 'OUT_OF_SERVICE' } });
      for (const vehicle of vehicles) {
        const fuelLogs = []; 
        const fuelCost = 0; 

        const maintenanceLogs = await MaintenanceLog.find({
          ticketId: { $in: await MaintenanceTicket.find({ vehicleId: vehicle._id }).distinct('_id') }
        });
        const maintenanceCost = maintenanceLogs.reduce((sum, log) => sum + (log.cost || 0), 0);

        const trips = await Trip.find({ vehicleId: vehicle._id, currentStatus: 'COMPLETED' });
        const totalDistance = trips.reduce((sum, trip) => sum + (trip.actualDistance || 0), 0);
        const revenue = totalDistance * 3.50; // Rate per km

        const acquisitionCost = vehicle.acquisitionCost || 0;
        const totalCosts = fuelCost + maintenanceCost;
        const netProfit = revenue - totalCosts;
        const roi = acquisitionCost > 0 ? ((netProfit) / acquisitionCost * 100).toFixed(2) : 0;

        rows.push([
          vehicle.name || 'N/A',
          vehicle.registrationNumber || vehicle.regNumber || 'N/A',
          revenue.toFixed(2),
          fuelCost.toFixed(2),
          maintenanceCost.toFixed(2),
          acquisitionCost.toFixed(2),
          roi
        ]);
      }
    } else if (type === 'trips') {
      title = "Trips Summary Report";
      headers = ['Trip Code', 'Route', 'Vehicle', 'Driver', 'Status', 'Departure', 'Arrival'];
      
      const trips = await Trip.find({}).populate('vehicleId').populate('driverId');
      rows = trips.map(t => [
        t.tripCode || 'N/A',
        t.routeName || `${t.origin?.name} -> ${t.destination?.name}`,
        t.vehicleId?.registrationNumber || 'N/A',
        t.driverId?.name || 'N/A',
        t.currentStatus,
        t.scheduledDeparture ? new Date(t.scheduledDeparture).toLocaleString() : 'N/A',
        t.scheduledArrival ? new Date(t.scheduledArrival).toLocaleString() : 'N/A'
      ]);
    } else if (type === 'maintenance') {
      title = "Maintenance Summary Report";
      headers = ['Ticket Code', 'Vehicle', 'Category', 'Priority', 'Status', 'Cost ($)'];
      
      const tickets = await MaintenanceTicket.find({}).populate('vehicleId');
      for (const ticket of tickets) {
        const logs = await MaintenanceLog.find({ ticketId: ticket._id });
        const cost = logs.reduce((sum, log) => sum + (log.cost || 0), 0);
        rows.push([
          ticket.ticketCode || 'N/A',
          ticket.vehicleId?.registrationNumber || 'N/A',
          ticket.category,
          ticket.priority,
          ticket.currentStatus,
          cost.toFixed(2)
        ]);
      }
    }

    if (format === 'pdf') {
      exportToPdf(res, title, headers, rows);
    } else {
      await exportToCsvOrXlsx(res, format, title, headers, rows);
    }
  } catch (error) {
    res.status(500).json({ success: false, error: 'SERVER_ERROR', message: error.message });
  }
};

// --- LEGACY ENDPOINTS (Support existing frontend reports screen) ---

const getLegacyFuelEfficiency = async (req, res) => {
  try {
    const trips = await Trip.find({ currentStatus: 'COMPLETED' }).populate('vehicleId');
    const statsMap = {};
    
    trips.forEach(trip => {
      if (!trip.vehicleId) return;
      const vId = trip.vehicleId._id.toString();
      if (!statsMap[vId]) {
        statsMap[vId] = {
          vehicleId: vId,
          regNumber: trip.vehicleId.regNumber || trip.vehicleId.registrationNumber,
          distance: 0,
          fuel: 0
        };
      }
      statsMap[vId].distance += trip.actualDistance || 0;
      statsMap[vId].fuel += trip.fuelConsumed || 0;
    });

    const report = Object.values(statsMap).map(item => ({
      ...item,
      efficiency: item.fuel > 0 ? (item.distance / item.fuel).toFixed(2) : 0
    }));

    res.json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getLegacyFleetUtilization = async (req, res) => {
  try {
    const totalVehicles = await Vehicle.countDocuments({ status: { $ne: 'OUT_OF_SERVICE' } });
    const onTrip = await Vehicle.countDocuments({ status: 'DISPATCHED' });
    const inShop = await Vehicle.countDocuments({ status: 'UNDER_MAINTENANCE' });
    const available = await Vehicle.countDocuments({ status: 'AVAILABLE' });

    const vehicles = await Vehicle.find({ status: { $ne: 'OUT_OF_SERVICE' } });
    const typeCount = {};
    vehicles.forEach(v => {
      typeCount[v.type] = (typeCount[v.type] || 0) + 1;
    });

    const byType = Object.entries(typeCount).map(([type, count]) => ({ type, count }));

    res.json({
      utilizationPercent: totalVehicles > 0 ? Math.round((onTrip / totalVehicles) * 100) : 0,
      breakdown: {
        onTrip,
        inShop,
        available,
        totalVehicles
      },
      byType
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getLegacyRoi = async (req, res) => {
  try {
    const vehicles = await Vehicle.find({ status: { $ne: 'OUT_OF_SERVICE' } });
    const report = [];

    for (const vehicle of vehicles) {
      const fuelCost = 0; // Reference mock

      const tickets = await MaintenanceTicket.find({ vehicleId: vehicle._id });
      const ticketIds = tickets.map(t => t._id);
      const maintenanceLogs = await MaintenanceLog.find({ ticketId: { $in: ticketIds } });
      const maintenanceCost = maintenanceLogs.reduce((sum, log) => sum + (log.cost || 0), 0);

      const trips = await Trip.find({ vehicleId: vehicle._id, currentStatus: 'COMPLETED' });
      const totalDistance = trips.reduce((sum, trip) => sum + (trip.actualDistance || 0), 0);
      const revenue = totalDistance * 3.50;

      const acquisitionCost = vehicle.acquisitionCost || 0;
      const totalCosts = fuelCost + maintenanceCost;
      const netProfit = revenue - totalCosts;
      const roi = acquisitionCost > 0 ? ((netProfit) / acquisitionCost * 100).toFixed(2) : 0;

      report.push({
        vehicleId: vehicle._id,
        regNumber: vehicle.regNumber || vehicle.registrationNumber,
        name: vehicle.name || 'N/A',
        revenue,
        maintenanceCost,
        fuelCost,
        acquisitionCost,
        roi: parseFloat(roi)
      });
    }

    res.json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getDashboardKPIs,
  getTripSummaryReport,
  getOnTimePerformanceReport,
  getVehicleUtilizationReport,
  getDriverPerformanceReport,
  getMaintenanceSummaryReport,
  getMaintenanceCostTrend,
  exportReport,
  getLegacyFuelEfficiency,
  getLegacyFleetUtilization,
  getLegacyRoi
};
