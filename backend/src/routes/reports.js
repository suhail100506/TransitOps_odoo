const express = require('express');
const Trip = require('../models/Trip');
const Vehicle = require('../models/Vehicle');
const Maintenance = require('../models/Maintenance');
const FuelLog = require('../models/FuelLog');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @route   GET api/reports/fuel-efficiency
// @desc    Get fuel efficiency statistics per vehicle
router.get('/fuel-efficiency', protect, async (req, res) => {
  try {
    // Group completed trips by vehicle and calculate totals
    const trips = await Trip.find({ status: 'Completed' }).populate('vehicleId');
    
    const statsMap = {};
    trips.forEach(trip => {
      if (!trip.vehicleId) return;
      const vId = trip.vehicleId._id.toString();
      if (!statsMap[vId]) {
        statsMap[vId] = {
          vehicleId: vId,
          regNumber: trip.vehicleId.regNumber,
          distance: 0,
          fuel: 0
        };
      }
      statsMap[vId].distance += trip.actualDistance || 0;
      statsMap[vId].fuel += trip.fuelConsumed || 0;
    });

    const report = Object.values(statsMap).map(item => ({
      ...item,
      efficiency: item.fuel > 0 ? (item.distance / item.fuel).toFixed(2) : 0 // km per Litre
    }));

    res.json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   GET api/reports/fleet-utilization
// @desc    Get current utilization stats
router.get('/fleet-utilization', protect, async (req, res) => {
  try {
    const totalVehicles = await Vehicle.countDocuments({ status: { $ne: 'Retired' } });
    const onTrip = await Vehicle.countDocuments({ status: 'On Trip' });
    const inShop = await Vehicle.countDocuments({ status: 'In Shop' });
    const available = await Vehicle.countDocuments({ status: 'Available' });

    // Group total vehicles by type
    const vehicles = await Vehicle.find({ status: { $ne: 'Retired' } });
    const typeCount = {};
    vehicles.forEach(v => {
      typeCount[v.type] = (typeCount[v.type] || 0) + 1;
    });

    const byType = Object.entries(typeCount).map(([type, count]) => ({
      type,
      count
    }));

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
});

// @route   GET api/reports/roi
// @desc    Calculate ROI details per vehicle
router.get('/roi', protect, async (req, res) => {
  try {
    const vehicles = await Vehicle.find({ status: { $ne: 'Retired' } });
    const report = [];

    for (const vehicle of vehicles) {
      // 1. Calculate Fuel Cost
      const fuelLogs = await FuelLog.find({ vehicleId: vehicle._id });
      const fuelCost = fuelLogs.reduce((sum, log) => sum + log.cost, 0);

      // 2. Calculate Maintenance Cost
      const maintenanceLogs = await Maintenance.find({ vehicleId: vehicle._id });
      const maintenanceCost = maintenanceLogs.reduce((sum, log) => sum + log.cost, 0);

      // 3. Estimate Revenue (e.g. $3.50 earned per completed trip km)
      const trips = await Trip.find({ vehicleId: vehicle._id, status: 'Completed' });
      const totalDistance = trips.reduce((sum, trip) => sum + (trip.actualDistance || 0), 0);
      const revenue = totalDistance * 3.50; // rate per km

      // 4. Acquisition Cost
      const acquisitionCost = vehicle.acquisitionCost;

      // 5. Calculate ROI: ((Revenue - Total Costs) / Acquisition Cost) * 100
      const totalCosts = fuelCost + maintenanceCost;
      const netProfit = revenue - totalCosts;
      const roi = acquisitionCost > 0 ? ((netProfit) / acquisitionCost * 100).toFixed(2) : 0;

      report.push({
        vehicleId: vehicle._id,
        regNumber: vehicle.regNumber,
        name: vehicle.name,
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
});

// @route   GET api/reports/export
// @desc    Export ROI summary as CSV
router.get('/export', protect, async (req, res) => {
  try {
    const vehicles = await Vehicle.find({ status: { $ne: 'Retired' } });
    
    let csv = 'Vehicle,Reg Number,Revenue ($),Fuel Cost ($),Maintenance Cost ($),Acquisition Cost ($),ROI (%)\n';
    
    for (const vehicle of vehicles) {
      const fuelLogs = await FuelLog.find({ vehicleId: vehicle._id });
      const fuelCost = fuelLogs.reduce((sum, log) => sum + log.cost, 0);

      const maintenanceLogs = await Maintenance.find({ vehicleId: vehicle._id });
      const maintenanceCost = maintenanceLogs.reduce((sum, log) => sum + log.cost, 0);

      const trips = await Trip.find({ vehicleId: vehicle._id, status: 'Completed' });
      const totalDistance = trips.reduce((sum, trip) => sum + (trip.actualDistance || 0), 0);
      const revenue = totalDistance * 3.50;

      const acquisitionCost = vehicle.acquisitionCost;
      const totalCosts = fuelCost + maintenanceCost;
      const netProfit = revenue - totalCosts;
      const roi = acquisitionCost > 0 ? ((netProfit) / acquisitionCost * 100).toFixed(2) : 0;

      csv += `"${vehicle.name}","${vehicle.regNumber}",${revenue.toFixed(2)},${fuelCost.toFixed(2)},${maintenanceCost.toFixed(2)},${acquisitionCost.toFixed(2)},${roi}\n`;
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=fleet-roi-report.csv');
    res.status(200).send(csv);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
