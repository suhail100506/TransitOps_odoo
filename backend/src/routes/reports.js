const express = require('express');
const Trip = require('../models/Trip');
const Vehicle = require('../models/Vehicle');
const Maintenance = require('../models/Maintenance');
const FuelLog = require('../models/FuelLog');
const { protect, allowRoles } = require('../middleware/auth');

const router = express.Router();

// @route   GET api/reports/fuel-efficiency
// @desc    Get fuel efficiency statistics per vehicle
router.get('/fuel-efficiency', protect, allowRoles(['financial_analyst', 'fleet_manager']), async (req, res) => {
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
router.get('/fleet-utilization', protect, allowRoles(['financial_analyst', 'fleet_manager']), async (req, res) => {
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

// Helper to aggregate ROI report data
const getROIReportData = async () => {
  return await Vehicle.aggregate([
    { $match: { status: { $ne: 'Retired' } } },
    {
      $lookup: {
        from: 'fuellogs',
        localField: '_id',
        foreignField: 'vehicleId',
        as: 'fuelLogs'
      }
    },
    {
      $lookup: {
        from: 'maintenances',
        localField: '_id',
        foreignField: 'vehicleId',
        as: 'maintenanceLogs'
      }
    },
    {
      $lookup: {
        from: 'trips',
        let: { vehicle_id: '$_id' },
        pipeline: [
          { 
            $match: { 
              $expr: { 
                $and: [ 
                  { $eq: ['$vehicleId', '$$vehicle_id'] }, 
                  { $eq: ['$status', 'Completed'] } 
                ] 
              } 
            } 
          }
        ],
        as: 'completedTrips'
      }
    },
    {
      $project: {
        regNumber: 1,
        name: 1,
        acquisitionCost: 1,
        fuelCost: { $sum: '$fuelLogs.cost' },
        maintenanceCost: { $sum: '$maintenanceLogs.cost' },
        revenue: {
          $multiply: [
            { $sum: '$completedTrips.actualDistance' },
            3.50
          ]
        }
      }
    },
    {
      $addFields: {
        totalCosts: { $add: ['$fuelCost', '$maintenanceCost'] }
      }
    },
    {
      $project: {
        vehicleId: '$_id',
        regNumber: 1,
        name: 1,
        revenue: 1,
        maintenanceCost: 1,
        fuelCost: 1,
        acquisitionCost: 1,
        roi: {
          $cond: {
            if: { $gt: ['$acquisitionCost', 0] },
            then: {
              $round: [
                {
                  $multiply: [
                    { $divide: [ { $subtract: ['$revenue', '$totalCosts'] }, '$acquisitionCost' ] },
                    100
                  ]
                },
                2
              ]
            },
            else: 0
          }
        }
      }
    }
  ]);
};

// @route   GET api/reports/roi
// @desc    Get ROI statistics per vehicle
router.get('/roi', protect, allowRoles(['financial_analyst', 'fleet_manager']), async (req, res) => {
  try {
    const report = await getROIReportData();
    res.json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// @route   GET api/reports/export
// @desc    Export ROI summary as CSV
router.get('/export', protect, allowRoles(['financial_analyst', 'fleet_manager']), async (req, res) => {
  try {
    const report = await getROIReportData();
    
    let csv = 'Vehicle,Reg Number,Revenue ($),Fuel Cost ($),Maintenance Cost ($),Acquisition Cost ($),ROI (%)\n';
    
    for (const vehicle of report) {
      csv += `"${vehicle.name}","${vehicle.regNumber}",${vehicle.revenue.toFixed(2)},${vehicle.fuelCost.toFixed(2)},${vehicle.maintenanceCost.toFixed(2)},${vehicle.acquisitionCost.toFixed(2)},${vehicle.roi}\n`;
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=fleet-roi-report.csv');
    res.status(200).send(csv);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
