require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Vehicle = require('./models/Vehicle');
const Driver = require('./models/Driver');
const Trip = require('./models/Trip');
const Maintenance = require('./models/Maintenance');
const FuelLog = require('./models/FuelLog');
const Expense = require('./models/Expense');

const seedData = async () => {
  try {
    console.log('Connecting to database for seeding...');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/transitops');

    // Clear existing data
    console.log('Clearing existing collections...');
    await User.deleteMany({});
    await Vehicle.deleteMany({});
    await Driver.deleteMany({});
    await Trip.deleteMany({});
    await Maintenance.deleteMany({});
    await FuelLog.deleteMany({});
    await Expense.deleteMany({});

    console.log('Creating seed users...');
    await User.create({
      name: 'Manager Joe',
      email: 'manager@transitops.com',
      passwordHash: 'password',
      role: 'fleet_manager'
    });

    await User.create({
      name: 'Driver Alex',
      email: 'alex@transitops.com',
      passwordHash: 'password',
      role: 'driver'
    });

    console.log('Creating seed vehicles...');
    const v1 = await Vehicle.create({
      regNumber: 'VAN-05',
      name: 'Mercedes Sprinter',
      model: '2023 Cargo',
      type: 'Van',
      maxLoadCapacity: 1500,
      odometer: 12950,
      acquisitionCost: 45000,
      status: 'On Trip'
    });

    const v2 = await Vehicle.create({
      regNumber: 'TRK-10',
      name: 'Volvo FH16',
      model: '2022 Heavy Duty',
      type: 'Semi-Truck',
      maxLoadCapacity: 18000,
      odometer: 84300,
      acquisitionCost: 140000,
      status: 'In Shop'
    });

    const v3 = await Vehicle.create({
      regNumber: 'BOX-03',
      name: 'Ford Transit Box',
      model: '2024 Cargo',
      type: 'Box Truck',
      maxLoadCapacity: 3500,
      odometer: 5400,
      acquisitionCost: 55000,
      status: 'Available'
    });

    console.log('Creating seed drivers...');
    const d1 = await Driver.create({
      name: 'Alex Johnson',
      licenseNumber: 'DL-A10983',
      licenseCategory: 'Heavy Rig (Class A)',
      licenseExpiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      contactNumber: '+1 (555) 123-9876',
      safetyScore: 95,
      status: 'On Trip'
    });

    const d2 = await Driver.create({
      name: 'Sarah Connor',
      licenseNumber: 'DL-B84310',
      licenseCategory: 'Commercial (Class B)',
      licenseExpiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
      contactNumber: '+1 (555) 234-5678',
      safetyScore: 88,
      status: 'Available'
    });

    // Driver with expired license — triggers red highlight in Drivers page
    await Driver.create({
      name: 'Marcus Wright',
      licenseNumber: 'DL-C11239',
      licenseCategory: 'Light Commercial',
      licenseExpiryDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      contactNumber: '+1 (555) 345-6789',
      safetyScore: 65,
      status: 'Available'
    });

    // Driver with license expiring in 20 days — triggers dashboard alert banner
    await Driver.create({
      name: 'Diana Prince',
      licenseNumber: 'DL-D20019',
      licenseCategory: 'Commercial (Class B)',
      licenseExpiryDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
      contactNumber: '+1 (555) 456-7890',
      safetyScore: 91,
      status: 'Available'
    });

    console.log('Creating seed trips...');
    // 1. Completed Trip — BOX-03 / Sarah Connor
    await Trip.create({
      source: 'Chicago, IL',
      destination: 'Detroit, MI',
      vehicleId: v3._id,
      driverId: d2._id,
      cargoWeight: 1200,
      plannedDistance: 450,
      actualDistance: 450,
      fuelConsumed: 95,
      status: 'Completed',
      dispatchedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
    });

    // 2. Completed Trip — VAN-05 / Alex Johnson (populates avg fuel efficiency)
    await Trip.create({
      source: 'Phoenix, AZ',
      destination: 'Tucson, AZ',
      vehicleId: v1._id,
      driverId: d1._id,
      cargoWeight: 900,
      plannedDistance: 185,
      actualDistance: 185,
      fuelConsumed: 42,
      status: 'Completed',
      dispatchedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)
    });

    // 3. Active Dispatched Trip — VAN-05 / Alex Johnson
    await Trip.create({
      source: 'Los Angeles, CA',
      destination: 'Las Vegas, NV',
      vehicleId: v1._id,
      driverId: d1._id,
      cargoWeight: 800,
      plannedDistance: 430,
      status: 'Dispatched',
      dispatchedAt: new Date()
    });

    // 4. Draft Trip — BOX-03 / Sarah Connor
    await Trip.create({
      source: 'Seattle, WA',
      destination: 'Portland, OR',
      vehicleId: v3._id,
      driverId: d2._id,
      cargoWeight: 1500,
      plannedDistance: 280,
      status: 'Draft'
    });

    console.log('Creating seed maintenance records...');
    await Maintenance.create({
      vehicleId: v2._id,
      description: 'Hydraulic line replacement & periodic brake check',
      cost: 1450,
      status: 'Open'
    });

    await Maintenance.create({
      vehicleId: v1._id,
      description: 'Scheduled tyre rotation',
      cost: 320,
      status: 'Closed',
      closedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
    });

    await Maintenance.create({
      vehicleId: v3._id,
      description: 'Oil change & air filter replacement',
      cost: 180,
      status: 'Closed',
      closedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    });

    console.log('Creating seed fuel logs...');
    // VAN-05
    await FuelLog.create({ vehicleId: v1._id, liters: 42, cost: 62.50, date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) });
    await FuelLog.create({ vehicleId: v1._id, liters: 55, cost: 82.00, date: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000) });
    // TRK-10
    await FuelLog.create({ vehicleId: v2._id, liters: 180, cost: 285.00, date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) });
    await FuelLog.create({ vehicleId: v2._id, liters: 210, cost: 336.00, date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) });
    // BOX-03
    await FuelLog.create({ vehicleId: v3._id, liters: 95, cost: 135.50, date: new Date(Date.now() - 1.5 * 24 * 60 * 60 * 1000) });
    await FuelLog.create({ vehicleId: v3._id, liters: 72, cost: 104.00, date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000) });

    console.log('Creating seed expenses...');
    // VAN-05
    await Expense.create({ vehicleId: v1._id, type: 'toll', amount: 28.50, date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) });
    await Expense.create({ vehicleId: v1._id, type: 'parking', amount: 15.00, date: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000) });
    // TRK-10
    await Expense.create({ vehicleId: v2._id, type: 'toll', amount: 65.00, date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) });
    await Expense.create({ vehicleId: v2._id, type: 'incidental', amount: 40.00, date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) });
    // BOX-03
    await Expense.create({ vehicleId: v3._id, type: 'toll', amount: 45.00, date: new Date(Date.now() - 1.5 * 24 * 60 * 60 * 1000) });
    await Expense.create({ vehicleId: v3._id, type: 'parking', amount: 20.00, date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000) });

    console.log('Database seeded successfully!');
    console.log('--------------------------------------------------');
    console.log('Demo Credentials:');
    console.log('Email:    manager@transitops.com');
    console.log('Password: password');
    console.log('--------------------------------------------------');
    console.log('Notes:');
    console.log('  Marcus Wright - expired license (red highlight demo)');
    console.log('  Diana Prince  - license expires in 20 days (alert banner demo)');
    console.log('--------------------------------------------------');

    mongoose.connection.close();
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seedData();
