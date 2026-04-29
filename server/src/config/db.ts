import mongoose from 'mongoose';
import { config } from './env';
import logger from '../utils/logger';

export const connectDB = async () => {
  try {
    logger.info('Attempting to connect to MongoDB...');
    // Log sanitized URI (hide password)
    const sanitizedUri = config.mongodbUri ? config.mongodbUri.replace(/:([^@:]+)@/, ':****@') : 'NOT SET';
    logger.info(`URI: ${sanitizedUri}`);

    await mongoose.connect(config.mongodbUri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
    });
    logger.info('✅ Connected to MongoDB');
  } catch (err: any) {
    logger.error(`❌ MongoDB connection error: ${err.message}`);
    if (err.message.includes('auth') || err.message.includes('Authentication')) {
      logger.error('👉 TIP: Please check your MONGODB_URI in settings and ensure the username/password are correct.');
    }
    // Don't exit process, let the server start so we can see health status
    // process.exit(1);
  }
};
