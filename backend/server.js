require('dotenv').config();
const connectDB = require('./src/config/db');
const app = require('./src/app');
const { startMaintenanceScheduler } = require('./src/jobs/maintenanceScheduler');

connectDB();

startMaintenanceScheduler();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
