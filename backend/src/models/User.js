const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ["Admin", "Dispatcher", "MaintenanceStaff", "Driver"],
    required: true
  },
  phone: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    default: 'Active'
  },
  
  // Driver specific fields
  licenseNumber: {
    type: String,
    trim: true,
    uppercase: true
  },
  licenseCategory: {
    type: String,
    trim: true
  },
  licenseExpiryDate: {
    type: Date
  },
  contactNumber: {
    type: String,
    trim: true
  },
  safetyScore: {
    type: Number,
    default: 100
  },
  driverStatus: {
    type: String,
    enum: ["Available", "On Trip", "Off Duty", "Suspended"],
    default: "Available"
  }
}, {
  timestamps: true
});

UserSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    next();
  } catch (error) {
    next(error);
  }
});

UserSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.passwordHash);
};

UserSchema.pre('validate', function(next) {
  if (this.role === 'Driver') {
    if (!this.driverStatus) this.driverStatus = 'Available';
    if (this.phone && !this.contactNumber) this.contactNumber = this.phone;
    if (this.contactNumber && !this.phone) this.phone = this.contactNumber;
  }
  next();
});

UserSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    if (ret.role === 'Driver') {
      ret.status = ret.driverStatus || 'Available';
    }
    return ret;
  }
});

module.exports = mongoose.model('User', UserSchema);
