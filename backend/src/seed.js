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
    // Create Manager User
    const manager = await User.create({
      name: 'Manager Joe',
      email: 'manager@transitops.com',
      passwordHash: 'password', // Pre-save hooks hashes this
      role: 'fleet_manager'
    });

    // Create Driver User
    const driverUser = await User.create({
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
      odometer: 12500,
      acquisitionCost: 45000,
      status: 'On Trip' // For the active trip
    });

    const v2 = await Vehicle.create({
      regNumber: 'TRK-10',
      name: 'Volvo FH16',
      model: '2022 Heavy Duty',
      type: 'Semi-Truck',
      maxLoadCapacity: 18000,
      odometer: 84300,
      acquisitionCost: 140000,
      status: 'In Shop' // For the maintenance record
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
      licenseExpiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      contactNumber: '+1 (555) 123-9876',
      safetyScore: 95,
      status: 'On Trip' // Assigned to active trip
    });

    const d2 = await Driver.create({
      name: 'Sarah Connor',
      licenseNumber: 'DL-B84310',
      licenseCategory: 'Commercial (Class B)',
      licenseExpiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 6 months from now
      contactNumber: '+1 (555) 234-5678',
      safetyScore: 88,
      status: 'Available'
    });

    const d3 = await Driver.create({
      name: 'Marcus Wright',
      licenseNumber: 'DL-C11239',
      licenseCategory: 'Light Commercial',
      licenseExpiryDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Expired 30 days ago
      contactNumber: '+1 (555) 345-6789',
      safetyScore: 65,
      status: 'Available'
    });

    console.log('Creating seed trips...');
    // 1. Completed Trip
    const tripCompleted = await Trip.create({
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

    // 2. Active Dispatched Trip
    const tripActive = await Trip.create({
      source: 'Los Angeles, CA',
      destination: 'Las Vegas, NV',
      vehicleId: v1._id,
      driverId: d1._id,
      cargoWeight: 800,
      plannedDistance: 430,
      status: 'Dispatched',
      dispatchedAt: new Date()
    });

    // 3. Draft Trip
    const tripDraft = await Trip.create({
      source: 'Seattle, WA',
      destination: 'Portland, OR',
      vehicleId: v3._id,
      driverId: d2._id,
      cargoWeight: 1500,
      plannedDistance: 280,
      status: 'Draft'
    });

    console.log('Creating seed maintenance & fuel logs...');
    // Maintenance record
    await Maintenance.create({
      vehicleId: v2._id,
      description: 'Hydraulic line replacement & periodic brake check',
      cost: 1450,
      status: 'Open'
    });

    // Completed maintenance record
    await Maintenance.create({
      vehicleId: v1._id,
      description: 'Scheduled tyre rotation',
      cost: 320,
      status: 'Closed',
      closedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
    });

    // Fuel logs
    await FuelLog.create({
      vehicleId: v3._id,
      liters: 95,
      cost: 135.50,
      date: new Date(Date.now() - 1.5 * 24 * 60 * 60 * 1000)
    });

    // Expenses
    await Expense.create({
      vehicleId: v3._id,
      type: 'toll',
      amount: 45.00,
      date: new Date(Date.now() - 1.5 * 24 * 60 * 60 * 1000)
    });

    console.log('Database seeded successfully!');
    console.log('--------------------------------------------------');
    console.log('Demo Credentials:');
    console.log('Email:    manager@transitops.com');
    console.log('Password: password');
    console.log('--------------------------------------------------');
    
    mongoose.connection.close();
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seedData();
