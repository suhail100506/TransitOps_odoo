const express = require('express');
const { protect } = require('../middleware/auth');
const authorize = require('../middleware/rbac');
const {
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
} = require('../controllers/reportController');

const router = express.Router();

router.get('/dashboard', protect, authorize('Admin', 'Dispatcher', 'MaintenanceStaff'), getDashboardKPIs);
router.get('/trips/summary', protect, authorize('Admin', 'Dispatcher'), getTripSummaryReport);
router.get('/trips/on-time-performance', protect, authorize('Admin', 'Dispatcher'), getOnTimePerformanceReport);
router.get('/vehicles/utilization', protect, authorize('Admin', 'Dispatcher'), getVehicleUtilizationReport);
router.get('/drivers/performance', protect, authorize('Admin', 'Dispatcher'), getDriverPerformanceReport);
router.get('/maintenance/summary', protect, authorize('Admin', 'MaintenanceStaff'), getMaintenanceSummaryReport);
router.get('/maintenance/cost-trend', protect, authorize('Admin', 'MaintenanceStaff'), getMaintenanceCostTrend);
router.get('/export', protect, authorize('Admin', 'Dispatcher', 'MaintenanceStaff'), exportReport);

// Legacy routes for frontend compatibility
router.get('/fuel-efficiency', protect, getLegacyFuelEfficiency);
router.get('/fleet-utilization', protect, getLegacyFleetUtilization);
router.get('/roi', protect, getLegacyRoi);

module.exports = router;
