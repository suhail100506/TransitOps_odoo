const express = require('express');
const { protect } = require('../middleware/auth');
const authorize = require('../middleware/rbac');
const {
  createTicket,
  listTickets,
  getTicketDetails,
  changeTicketStatus,
  createSchedule,
  listSchedules,
  getVehicleMaintenanceHistory,
  getVehicleAvailability
} = require('../controllers/maintenanceController');

const router = express.Router();

router.post('/schedule', protect, authorize('Admin', 'MaintenanceStaff'), createSchedule);
router.get('/schedule/upcoming', protect, authorize('Admin', 'MaintenanceStaff', 'Dispatcher'), listSchedules);

router.get('/vehicle/:vehicleId/history', protect, authorize('Admin', 'MaintenanceStaff', 'Dispatcher'), getVehicleMaintenanceHistory);
router.get('/vehicle/:vehicleId/availability', protect, authorize('Admin', 'Dispatcher'), getVehicleAvailability);

router.post('/tickets', protect, authorize('Admin', 'MaintenanceStaff'), createTicket);
router.get('/tickets', protect, authorize('Admin', 'MaintenanceStaff', 'Dispatcher'), listTickets);
router.get('/tickets/:id', protect, authorize('Admin', 'MaintenanceStaff', 'Dispatcher'), getTicketDetails);
router.patch('/tickets/:id/status', protect, authorize('Admin', 'MaintenanceStaff'), changeTicketStatus);

// Legacy compatibility routes
router.get('/', protect, authorize('Admin', 'MaintenanceStaff', 'Dispatcher'), listTickets);
router.post('/', protect, authorize('Admin', 'MaintenanceStaff'), createTicket);
router.post('/:id/close', protect, authorize('Admin', 'MaintenanceStaff'), (req, res, next) => {
  req.body.status = 'CLOSED';
  changeTicketStatus(req, res, next);
});

module.exports = router;
