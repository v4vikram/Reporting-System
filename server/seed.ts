import mongoose from 'mongoose';
import User from './models/User';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/multi-tenant-app';

const seedUsers = [
  {
    name: 'Super Admin',
    email: 'admin@example.com',
    password: 'password123',
    role: 'super_admin',
    clientId: 'system',
    isActive: true
  },
  {
    name: 'Standard Employee',
    email: 'employee@example.com',
    password: 'password123',
    role: 'employee',
    clientId: 'system',
    isActive: true
  },
  {
    name: 'Test Client',
    email: 'client@example.com',
    password: 'password123',
    role: 'client',
    clientId: 'client_001',
    isActive: true
  }
];

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB for seeding...');

    // Clear existing users to avoid duplicates
    await User.deleteMany({ email: { $in: seedUsers.map(u => u.email) } });
    
    for (const userData of seedUsers) {
      const user = new User(userData);
      await user.save();
      console.log(`Created ${userData.role}: ${userData.email}`);
    }

    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
}

seed();
