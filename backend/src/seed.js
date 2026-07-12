require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Vehicle = require('./models/Vehicle');
const Driver = require('./models/Driver');
const Trip = require('./models/Trip');
const Maintenance = require('./models/Maintenance');
const FuelLog = require('./models/FuelLog');
const Expense = require('./models/Expense');

// Trip branch models
const TripStatusHistory = require('./models/TripStatusHistory');
const MaintenanceTicket = require('./models/MaintenanceTicket');
const MaintenanceLog = require('./models/MaintenanceLog');
const MaintenanceSchedule = require('./models/MaintenanceSchedule');

const seedData = async () => {
  try {
    console.log('Connecting to database for seeding...');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/transitops');

    console.log('Clearing existing collections...');
    await User.deleteMany({});
    await Vehicle.deleteMany({});
    await Driver.deleteMany({});
    await Trip.deleteMany({});
    await Maintenance.deleteMany({});
    await FuelLog.deleteMany({});
    await Expense.deleteMany({});
    await TripStatusHistory.deleteMany({});
    await MaintenanceTicket.deleteMany({});
    await MaintenanceLog.deleteMany({});
    await MaintenanceSchedule.deleteMany({});

    console.log('Creating users (Admin, Managers, Drivers)...');
    const adminUser = await User.create({
      name: 'System Admin',
      email: 'admin@transitops.com',
      passwordHash: 'admin123',
      role: 'admin'
    });

    const managerUser = await User.create({
      name: 'Manager Rajesh',
      email: 'manager@transitops.com',
      passwordHash: 'password',
      role: 'fleet_manager'
    });

    const driverUser = await User.create({
      name: 'Driver Amit',
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
      name: 'Amit Sharma',
      licenseNumber: 'DL-A10983',
      licenseCategory: 'Heavy Rig (Class A)',
      licenseExpiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      contactNumber: '+91 98765 43210',
      safetyScore: 95,
      status: 'On Trip'
    });

    const d2 = await Driver.create({
      name: 'Priya Patel',
      licenseNumber: 'DL-B84310',
      licenseCategory: 'Commercial (Class B)',
      licenseExpiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
      contactNumber: '+91 98765 12345',
      safetyScore: 88,
      status: 'Available'
    });

    // Driver with expired license — triggers red highlight in Drivers page
    await Driver.create({
      name: 'Vikram Singh',
      licenseNumber: 'DL-C11239',
      licenseCategory: 'Light Commercial',
      licenseExpiryDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      contactNumber: '+91 99887 76655',
      safetyScore: 65,
      status: 'Available'
    });

    // Driver with license expiring in 20 days — triggers dashboard alert banner
    await Driver.create({
      name: 'Kiran Bedi',
      licenseNumber: 'DL-D20019',
      licenseCategory: 'Commercial (Class B)',
      licenseExpiryDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
      contactNumber: '+91 99001 12233',
      safetyScore: 91,
      status: 'Available'
    });

    console.log('Creating seed trips...');
    // 1. Completed Trip — BOX-03 / Priya Patel
    const trip1 = await Trip.create({
      source: 'Mumbai, MH',
      destination: 'Pune, MH',
      vehicleId: v3._id,
      driverId: d2._id,
      cargoWeight: 1200,
      plannedDistance: 150,
      actualDistance: 150,
      fuelConsumed: 32,
      status: 'Completed',
      tripCode: 'TRP-000001',
      routeName: 'Mumbai to Pune',
      origin: { name: 'Mumbai, MH', lat: 19.0760, lng: 72.8777 },
      scheduledDeparture: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      scheduledArrival: new Date(Date.now() - 1.9 * 24 * 60 * 60 * 1000),
      dispatchedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
    });

    // Create TripStatusHistory for Trip 1
    await TripStatusHistory.create([
      { tripId: trip1._id, status: 'SCHEDULED', sequence: 1, changedBy: managerUser._id, note: 'Scheduled' },
      { tripId: trip1._id, status: 'DISPATCHED', sequence: 2, changedBy: managerUser._id, note: 'Dispatched' },
      { tripId: trip1._id, status: 'IN_TRANSIT', sequence: 3, changedBy: driverUser._id, note: 'En route' },
      { tripId: trip1._id, status: 'COMPLETED', sequence: 4, changedBy: driverUser._id, note: 'Completed' }
    ]);

    // 2. Completed Trip — VAN-05 / Amit Sharma
    const trip2 = await Trip.create({
      source: 'Delhi, DL',
      destination: 'Jaipur, RJ',
      vehicleId: v1._id,
      driverId: d1._id,
      cargoWeight: 900,
      plannedDistance: 270,
      actualDistance: 270,
      fuelConsumed: 55,
      status: 'Completed',
      tripCode: 'TRP-000002',
      routeName: 'Delhi to Jaipur',
      origin: { name: 'Delhi, DL', lat: 28.7041, lng: 77.1025 },
      scheduledDeparture: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      scheduledArrival: new Date(Date.now() - 4.9 * 24 * 60 * 60 * 1000),
      dispatchedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)
    });

    await TripStatusHistory.create([
      { tripId: trip2._id, status: 'SCHEDULED', sequence: 1, changedBy: managerUser._id, note: 'Scheduled' },
      { tripId: trip2._id, status: 'COMPLETED', sequence: 2, changedBy: driverUser._id, note: 'Completed' }
    ]);

    // 3. Active Dispatched Trip — VAN-05 / Amit Sharma
    const trip3 = await Trip.create({
      source: 'Ahmedabad, GJ',
      destination: 'Mumbai, MH',
      vehicleId: v1._id,
      driverId: d1._id,
      cargoWeight: 800,
      plannedDistance: 530,
      status: 'Dispatched',
      tripCode: 'TRP-000003',
      routeName: 'Ahmedabad to Mumbai',
      origin: { name: 'Ahmedabad, GJ', lat: 23.0225, lng: 72.5714 },
      scheduledDeparture: new Date(Date.now() - 2 * 60 * 60 * 1000),
      scheduledArrival: new Date(Date.now() + 2 * 60 * 60 * 1000),
      dispatchedAt: new Date()
    });

    await TripStatusHistory.create([
      { tripId: trip3._id, status: 'SCHEDULED', sequence: 1, changedBy: managerUser._id, note: 'Scheduled' },
      { tripId: trip3._id, status: 'DISPATCHED', sequence: 2, changedBy: managerUser._id, note: 'Dispatched' }
    ]);

    // 4. Draft Trip — BOX-03 / Priya Patel
    const trip4 = await Trip.create({
      source: 'Gandhinagar, GJ',
      destination: 'Surat, GJ',
      vehicleId: v3._id,
      driverId: d2._id,
      cargoWeight: 1500,
      plannedDistance: 280,
      status: 'Draft',
      tripCode: 'TRP-000004',
      routeName: 'Gandhinagar to Surat',
      origin: { name: 'Gandhinagar, GJ', lat: 23.2156, lng: 72.6369 },
      scheduledDeparture: new Date(Date.now() + 24 * 60 * 60 * 1000),
      scheduledArrival: new Date(Date.now() + 27 * 60 * 60 * 1000)
    });

    await TripStatusHistory.create([
      { tripId: trip4._id, status: 'SCHEDULED', sequence: 1, changedBy: managerUser._id, note: 'Scheduled' }
    ]);

    console.log('Creating seed maintenance tickets...');
    const ticket1 = await MaintenanceTicket.create({
      ticketCode: 'MNT-000001',
      vehicleId: v2._id,
      category: 'BREAKDOWN',
      priority: 'CRITICAL',
      reportedBy: adminUser._id,
      currentStatus: 'OPEN',
      description: 'Hydraulic line replacement & periodic brake check',
      lastSequence: 1
    });

    // Also populate legacy Maintenance model for safety
    await Maintenance.create({
      vehicleId: v2._id,
      description: 'Hydraulic line replacement & periodic brake check',
      cost: 1450,
      status: 'Open'
    });

    await MaintenanceLog.create({
      ticketId: ticket1._id,
      status: 'OPEN',
      sequence: 1,
      changedBy: managerUser._id,
      note: 'Breakdown ticket registered.',
      cost: 1450
    });

    const ticket2 = await MaintenanceTicket.create({
      ticketCode: 'MNT-000002',
      vehicleId: v1._id,
      category: 'SCHEDULED_SERVICE',
      priority: 'LOW',
      reportedBy: adminUser._id,
      currentStatus: 'CLOSED',
      description: 'Scheduled tyre rotation',
      lastSequence: 2
    });

    await Maintenance.create({
      vehicleId: v1._id,
      description: 'Scheduled tyre rotation',
      cost: 320,
      status: 'Closed',
      closedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
    });

    await MaintenanceLog.create([
      { ticketId: ticket2._id, status: 'OPEN', sequence: 1, changedBy: managerUser._id, note: 'Tyre rotation logged', cost: 0 },
      { ticketId: ticket2._id, status: 'CLOSED', sequence: 2, changedBy: managerUser._id, note: 'Rotation complete. Tyres replaced.', cost: 320 }
    ]);

    await MaintenanceSchedule.create([
      { vehicleId: v1._id, scheduleType: 'TIME_BASED', dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), status: 'UPCOMING' },
      { vehicleId: v3._id, scheduleType: 'MILEAGE_BASED', dueMileage: 6000, status: 'UPCOMING' }
    ]);

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
    await Expense.create({ vehicleId: v1._id, type: 'other', amount: 15.00, date: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000) });
    // TRK-10
    await Expense.create({ vehicleId: v2._id, type: 'toll', amount: 65.00, date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) });
    await Expense.create({ vehicleId: v2._id, type: 'other', amount: 40.00, date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) });
    // BOX-03
    await Expense.create({ vehicleId: v3._id, type: 'toll', amount: 45.00, date: new Date(Date.now() - 1.5 * 24 * 60 * 60 * 1000) });
    await Expense.create({ vehicleId: v3._id, type: 'other', amount: 20.00, date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000) });

    console.log('Database seeded successfully!');
    console.log('--------------------------------------------------');
    console.log('Demo Credentials:');
    console.log('Admin Email:   admin@transitops.com');
    console.log('Manager Email: manager@transitops.com');
    console.log('Driver Email:  alex@transitops.com');
    console.log('Password:      password / admin123 (for admin)');
    console.log('--------------------------------------------------');

    mongoose.connection.close();
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seedData();
