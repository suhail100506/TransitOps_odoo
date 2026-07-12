const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth');
const vehicleRoutes = require('./routes/vehicles');
const driverRoutes = require('./routes/drivers');
const dashboardRoutes = require('./routes/dashboard');
const tripRoutes = require('./routes/tripRoutes');
const maintenanceRoutes = require('./routes/maintenanceRoutes');
const reportRoutes = require('./routes/reportRoutes');
const fuelLogRoutes = require('./routes/fuelLogs');
const expenseRoutes = require('./routes/expenses');

const app = express();

app.use(helmet());
app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/fuel-logs', fuelLogRoutes);
app.use('/api/expenses', expenseRoutes);

app.use(errorHandler);

module.exports = app;
