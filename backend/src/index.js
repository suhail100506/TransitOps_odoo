require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

// Initialize app
const app = express();

// Connect to Database
connectDB();

// Middleware
app.use(cors({
  origin: '*', // For hackathon speed, allow all. In production, restrict to VITE dev port.
  credentials: true
}));
app.use(express.json());

// Base health check route
app.get('/', (req, res) => {
  res.json({ message: 'TransitOps API is running.' });
});

// Import Routes
const authRoutes = require('./routes/auth');
const vehicleRoutes = require('./routes/vehicles');
const driverRoutes = require('./routes/drivers');
const dashboardRoutes = require('./routes/dashboard');
const tripRoutes = require('./routes/trips');
const maintenanceRoutes = require('./routes/maintenance');
const reportRoutes = require('./routes/reports');
const fuelLogRoutes = require('./routes/fuelLogs');
const expenseRoutes = require('./routes/expenses');

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/fuel-logs', fuelLogRoutes);
app.use('/api/expenses', expenseRoutes);

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
