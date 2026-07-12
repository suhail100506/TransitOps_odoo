const Trip = require("../models/Trip");
const MaintenanceTicket = require("../models/MaintenanceTicket");

const generateTripCode = async () => {
  const count = await Trip.countDocuments({});
  const nextNum = count + 1;
  return `TRP-${String(nextNum).padStart(6, '0')}`;
};

const generateTicketCode = async () => {
  const count = await MaintenanceTicket.countDocuments({});
  const nextNum = count + 1;
  return `MNT-${String(nextNum).padStart(6, '0')}`;
};

module.exports = {
  generateTripCode,
  generateTicketCode
};
