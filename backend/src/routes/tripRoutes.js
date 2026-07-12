const express = require('express');
const { protect } = require('../middleware/auth');
const authorize = require('../middleware/rbac');
const {
  createTrip,
  listTrips,
  getTripDetails,
  assignVehicleAndDriver,
  changeTripStatus,
  getDispatchBoard,
  getDriverTrips
} = require('../controllers/tripController');

const router = express.Router();

router.get('/dispatch-board', protect, authorize('Admin', 'Dispatcher'), getDispatchBoard);
router.get('/driver/:driverId', protect, getDriverTrips);

router.post('/', protect, authorize('Admin', 'Dispatcher'), createTrip);
router.get('/', protect, authorize('Admin', 'Dispatcher'), listTrips);

router.get('/:id', protect, getTripDetails);

router.patch('/:id/assign', protect, authorize('Admin', 'Dispatcher'), assignVehicleAndDriver);
router.patch('/:id/status', protect, changeTripStatus);
router.patch('/:id/cancel', protect, authorize('Admin', 'Dispatcher'), (req, res, next) => {
  req.body.status = 'CANCELLED';
  changeTripStatus(req, res, next);
});

// Legacy POST compatibility routes for frontend
router.post('/:id/dispatch', protect, (req, res, next) => {
  req.body.status = 'DISPATCHED';
  changeTripStatus(req, res, next);
});
router.post('/:id/complete', protect, (req, res, next) => {
  req.body.status = 'COMPLETED';
  changeTripStatus(req, res, next);
});
router.post('/:id/cancel', protect, (req, res, next) => {
  req.body.status = 'CANCELLED';
  changeTripStatus(req, res, next);
});

module.exports = router;
