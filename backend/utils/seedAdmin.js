const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');

// Load environment variables from backend directory
dotenv.config({ path: __dirname + '/../.env' });

const seedAdmin = async () => {
  try {
    if (!process.env.MONGO_URI) {
      console.error('MONGO_URI is not defined in the environment variables.');
      process.exit(1);
    }
    
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected for Seeding...');

    const email = 'admin@ridex.com';
    const adminExists = await User.findOne({ email });

    if (adminExists) {
      console.log('Admin user already exists.');
      process.exit(0);
    }

    const admin = new User({
      name: 'RideX Administrator',
      email,
      password: 'admin123', // Will be hashed automatically by userSchema pre('save') middleware
      role: 'admin',
      phone: '1234567890',
    });

    await admin.save();
    console.log('Admin user created successfully!');
    console.log('Email: admin@ridex.com');
    console.log('Password: admin123');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin:', error);
    process.exit(1);
  }
};

seedAdmin();
