import winston from 'winston';
import { config } from '../config/env';

const { combine, timestamp, json, colorize, printf } = winston.format;

// Custom format for local development
const devFormat = printf(({ level, message, timestamp }) => {
  return `${timestamp} ${level}: ${message}`;
});

const logger = winston.createLogger({
  level: config.nodeEnv === 'production' ? 'info' : 'debug',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    config.nodeEnv === 'production' ? json() : combine(colorize(), devFormat)
  ),
  transports: [
    new winston.transports.Console(),
  ],
});

export default logger;
