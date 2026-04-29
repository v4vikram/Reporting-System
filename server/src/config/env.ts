import dotenv from 'dotenv';
import path from 'path';

// Load the appropriate env file
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env';
dotenv.config({ path: path.join(__dirname, '../../', envFile), override: true });

console.log('Environment file path:', path.join(__dirname, '../../', envFile));
console.log('MONGODB_URI loaded:', !!process.env.MONGODB_URI);
console.log('NODE_ENV:', process.env.NODE_ENV);

export const config = {
  port: 5000, // Fixed internal port for backend
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/multi-tenant-app',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
  jwtSecret: process.env.JWT_SECRET || 'your_super_secret_jwt_key_here',
  nodeEnv: process.env.NODE_ENV || 'development'
};
