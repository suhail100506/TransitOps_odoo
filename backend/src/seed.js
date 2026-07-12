require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Vehicle = require('./models/Vehicle');
const Trip = require('./models/Trip');
const TripStatusHistory = require('./models/TripStatusHistory');
const MaintenanceTicket = require('./models/MaintenanceTicket');
const MaintenanceLog = require('./models/MaintenanceLog');
const MaintenanceSchedule = require('./models/MaintenanceSchedule');
const FuelLog = require('./models/FuelLog');
const Expense = require('./models/Expense');

const seedData = async () => {
  try {
    console.log('Connecting to database for seeding...');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/transitops');
    
    console.log('Clearing existing collections...');
    await User.deleteMany({});
    await Vehicle.deleteMany({});
    await Trip.deleteMany({});
    await TripStatusHistory.deleteMany({});
    await MaintenanceTicket.deleteMany({});
    await MaintenanceLog.deleteMany({});
    await MaintenanceSchedule.deleteMany({});
    await FuelLog.deleteMany({});
    await Expense.deleteMany({});

    console.log('Creating users (Admin & Drivers)...');
    const admin = await User.create({
      name: 'Manager Joe',
      email: 'manager@transitops.com',
      passwordHash: 'password',
      role: 'Admin',
      phone: '+1 (555) 999-1234'
    });

    const driver = await User.create({
      name: 'Alex Johnson',
      email: 'alex@transitops.com',
      passwordHash: 'password',
      role: 'Driver',
      phone: '+1 (555) 123-9876',
      licenseNumber: 'DL-A10983',
      licenseCategory: 'Heavy Rig (Class A)',
      licenseExpiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      contactNumber: '+1 (555) 123-9876',
      driverStatus: 'Available',
      safetyScore: 95
    });

    const driver2 = await User.create({
      name: 'Sarah Connor',
      email: 'sarah@transitops.com',
      passwordHash: 'password',
      role: 'Driver',
      phone: '+1 (555) 234-5678',
      licenseNumber: 'DL-B84310',
      licenseCategory: 'Commercial (Class B)',
      licenseExpiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
      contactNumber: '+1 (555) 234-5678',
      driverStatus: 'Available',
      safetyScore: 88
    });

    console.log('Creating vehicles...');
    const v1 = await Vehicle.create({
      registrationNumber: 'VAN-05',
      name: 'Mercedes Sprinter',
      model: '2023 Cargo',
      type: 'VAN',
      capacity: 1500,
      odometer: 12500,
      acquisitionCost: 45000,
      status: 'AVAILABLE'
    });

    const v2 = await Vehicle.create({
      registrationNumber: 'TRK-10',
      name: 'Volvo FH16',
      model: '2022 Heavy Duty',
      type: 'TRUCK',
      capacity: 18000,
      odometer: 84300,
      acquisitionCost: 140000,
      status: 'UNDER_MAINTENANCE'
    });

    const v3 = await Vehicle.create({
      registrationNumber: 'BOX-03',
      name: 'Ford Transit Box',
      model: '2024 Cargo',
      type: 'TRUCK',
      capacity: 3500,
      odometer: 5400,
      acquisitionCost: 55000,
      status: 'AVAILABLE'
    });

    console.log('Creating trips...');
    const trip1 = await Trip.create({
      tripCode: 'TRP-000001',
      routeName: 'Chicago to Detroit',
      origin: { name: 'Chicago, IL', lat: 41.8781, lng: -87.6298 },
      destination: { name: 'Detroit, MI', lat: 42.3314, lng: -83.0458 },
      scheduledDeparture: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      scheduledArrival: new Date(Date.now() - 1.9 * 24 * 60 * 60 * 1000),
      vehicleId: v3._id,
      driverId: driver2._id,
      dispatchedBy: admin._id,
      currentStatus: 'COMPLETED',
      cargoWeight: 1200,
      plannedDistance: 450,
      actualDistance: 450,
      fuelConsumed: 95,
      lastSequence: 4,
      dispatchedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 1.9 * 24 * 60 * 60 * 1000)
    });

    await TripStatusHistory.create([
      { tripId: trip1._id, status: 'SCHEDULED', sequence: 1, changedBy: admin._id, note: 'Scheduled' },
      { tripId: trip1._id, status: 'DISPATCHED', sequence: 2, changedBy: admin._id, note: 'Dispatched' },
      { tripId: trip1._id, status: 'IN_TRANSIT', sequence: 3, changedBy: driver2._id, note: 'En route' },
      { tripId: trip1._id, status: 'COMPLETED', sequence: 4, changedBy: driver2._id, note: 'Completed' }
    ]);

    const trip2 = await Trip.create({
      tripCode: 'TRP-000002',
      routeName: 'Los Angeles to Las Vegas',
      origin: { name: 'Los Angeles, CA', lat: 34.0522, lng: -118.2437 },
      destination: { name: 'Las Vegas, NV', lat: 36.1716, lng: -115.1398 },
      scheduledDeparture: new Date(Date.now() - 2 * 60 * 60 * 1000),
      scheduledArrival: new Date(Date.now() + 2 * 60 * 60 * 1000),
      vehicleId: v1._id,
      driverId: driver._id,
      dispatchedBy: admin._id,
      currentStatus: 'DISPATCHED',
      cargoWeight: 800,
      plannedDistance: 430,
      lastSequence: 2,
      dispatchedAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
    });

    await TripStatusHistory.create([
      { tripId: trip2._id, status: 'SCHEDULED', sequence: 1, changedBy: admin._id, note: 'Scheduled' },
      { tripId: trip2._id, status: 'DISPATCHED', sequence: 2, changedBy: admin._id, note: 'Dispatched' }
    ]);

    v1.status = 'DISPATCHED';
    await v1.save();
    driver.driverStatus = 'On Trip';
    await driver.save();

    const trip3 = await Trip.create({
      tripCode: 'TRP-000003',
      routeName: 'Seattle to Portland',
      origin: { name: 'Seattle, WA', lat: 47.6062, lng: -122.3321 },
      destination: { name: 'Portland, OR', lat: 45.5152, lng: -122.6784 },
      scheduledDeparture: new Date(Date.now() + 24 * 60 * 60 * 1000),
      scheduledArrival: new Date(Date.now() + 27 * 60 * 60 * 1000),
      vehicleId: v3._id,
      driverId: driver2._id,
      dispatchedBy: admin._id,
      currentStatus: 'SCHEDULED',
      cargoWeight: 1500,
      plannedDistance: 280,
      lastSequence: 1
    });

    await TripStatusHistory.create([
      { tripId: trip3._id, status: 'SCHEDULED', sequence: 1, changedBy: admin._id, note: 'Scheduled' }
    ]);

    console.log('Creating maintenance tickets...');
    const ticket1 = await MaintenanceTicket.create({
      ticketCode: 'MNT-000001',
      vehicleId: v2._id,
      category: 'BREAKDOWN',
      priority: 'CRITICAL',
      reportedBy: admin._id,
      currentStatus: 'OPEN',
      description: 'Hydraulic line replacement & periodic brake check',
      lastSequence: 1
    });

    await MaintenanceLog.create({
      ticketId: ticket1._id,
      status: 'OPEN',
      sequence: 1,
      changedBy: admin._id,
      note: 'Breakdown ticket registered.',
      cost: 1450
    });

    v2.activeMaintenanceTicketId = ticket1._id;
    await v2.save();

    const ticket2 = await MaintenanceTicket.create({
      ticketCode: 'MNT-000002',
      vehicleId: v1._id,
      category: 'SCHEDULED_SERVICE',
      priority: 'LOW',
      reportedBy: admin._id,
      currentStatus: 'CLOSED',
      description: 'Scheduled tyre rotation',
      lastSequence: 2
    });

    await MaintenanceLog.create([
      { ticketId: ticket2._id, status: 'OPEN', sequence: 1, changedBy: admin._id, note: 'Tyre rotation logged', cost: 0 },
      { ticketId: ticket2._id, status: 'CLOSED', sequence: 2, changedBy: admin._id, note: 'Rotation complete. Tyres replaced.', cost: 320 }
    ]);

    console.log('Creating maintenance schedules...');
    await MaintenanceSchedule.create([
      { vehicleId: v1._id, scheduleType: 'TIME_BASED', dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), status: 'UPCOMING' },
      { vehicleId: v3._id, scheduleType: 'MILEAGE_BASED', dueMileage: 6000, status: 'UPCOMING' }
    ]);

    console.log('Creating fuel logs & expenses...');
    await FuelLog.create({
      vehicleId: v3._id,
      liters: 95,
      cost: 135.50,
      date: new Date(Date.now() - 1.5 * 24 * 60 * 60 * 1000)
    });

    await Expense.create({
      vehicleId: v3._id,
      type: 'toll',
      amount: 45.00,
      date: new Date(Date.now() - 1.5 * 24 * 60 * 60 * 1000)
    });

    console.log('Database seeded successfully!');
    console.log('--------------------------------------------------');
    console.log('Credentials:');
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
