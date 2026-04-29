import mongoose from 'mongoose';
import { config } from './env';
import logger from '../utils/logger';

export const connectDB = async () => {
  try {
    logger.info('Attempting to connect to MongoDB...');
    // Log sanitized URI (hide password)
    const sanitizedUri = config.mongodbUri.replace(/:([^@:]+)@/, ':****@');
    logger.info(`URI: ${sanitizedUri}`);

    await mongoose.connect(config.mongodbUri);
    logger.info('✅ Connected to MongoDB');
  } catch (err: any) {
    logger.error(`❌ MongoDB connection error: ${err.message}`);
    process.exit(1);
  }
};
