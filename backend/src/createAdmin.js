require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('./models/User');

const createAdmin = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/transitops';
    console.log('Connecting to MongoDB at:', mongoUri);
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB.');

    const adminEmail = 'admin@transitops.com';
    const existing = await User.findOne({ email: adminEmail });
    if (existing) {
      console.log('Admin already exists.');
      process.exit(0);
    }

    await User.create({
      name: 'System Admin',
      email: adminEmail,
      passwordHash: 'admin123',
      role: 'admin'
    });

    console.log('Admin user created successfully!');
    console.log('Email:    admin@transitops.com');
    console.log('Password: admin123');
    process.exit(0);
  } catch (err) {
    console.error('Error creating admin user:', err);
    process.exit(1);
  }
};

createAdmin();
