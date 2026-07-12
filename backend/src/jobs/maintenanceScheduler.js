const cron = require('node-cron');
const mongoose = require('mongoose');
const MaintenanceSchedule = require('../models/MaintenanceSchedule');
const Vehicle = require('../models/Vehicle');
const MaintenanceTicket = require('../models/MaintenanceTicket');
const { generateTicketCode } = require('../utils/generateCode');

const runScheduler = async () => {
  console.log('Running daily maintenance scheduler scan...');
  try {
    const schedules = await MaintenanceSchedule.find({ status: { $in: ['UPCOMING', 'DUE'] } }).populate('vehicleId');
    const today = new Date();

    for (const schedule of schedules) {
      if (!schedule.vehicleId) continue;
      const vehicle = schedule.vehicleId;
      let newStatus = schedule.status;

      if (schedule.scheduleType === 'TIME_BASED') {
        if (schedule.dueDate <= today) {
          const daysDiff = (today - schedule.dueDate) / (1000 * 60 * 60 * 24);
          if (daysDiff > 1) {
            newStatus = 'OVERDUE';
          } else {
            newStatus = 'DUE';
          }
        }
      } else if (schedule.scheduleType === 'MILEAGE_BASED') {
        if (vehicle.odometer >= schedule.dueMileage) {
          const mileageDiff = vehicle.odometer - schedule.dueMileage;
          if (mileageDiff > 100) {
            newStatus = 'OVERDUE';
          } else {
            newStatus = 'DUE';
          }
        }
      }

      if (newStatus !== schedule.status) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
          schedule.status = newStatus;

          if (newStatus === 'OVERDUE' && !schedule.linkedTicketId) {
            const code = await generateTicketCode();
            
            const ticket = await MaintenanceTicket.create([{
              ticketCode: code,
              vehicleId: vehicle._id,
              category: 'SCHEDULED_SERVICE',
              priority: 'HIGH',
              reportedBy: vehicle.activeMaintenanceTicketId || null,
              currentStatus: 'OPEN',
              description: `Auto-generated ticket for overdue preventive maintenance (${schedule.scheduleType})`
            }], { session });

            schedule.linkedTicketId = ticket[0]._id;
            vehicle.status = 'UNDER_MAINTENANCE';
            vehicle.activeMaintenanceTicketId = ticket[0]._id;
            await vehicle.save({ session });
          }

          await schedule.save({ session });
          await session.commitTransaction();
          session.endSession();
          console.log(`Updated schedule ${schedule._id} status to ${newStatus} for vehicle ${vehicle.registrationNumber}`);
        } catch (error) {
          await session.abortTransaction();
          session.endSession();
          console.error(`Error updating schedule ${schedule._id}:`, error);
        }
      }
    }
  } catch (error) {
    console.error('Maintenance scheduler run failed:', error);
  }
};

const startMaintenanceScheduler = () => {
  cron.schedule('0 0 * * *', runScheduler);
  console.log('Maintenance scheduler cron job registered.');
};

module.exports = {
  startMaintenanceScheduler,
  runScheduler
};
