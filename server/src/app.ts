import mongoose from 'mongoose';
import { config } from './config/env';
import { connectDB } from './config/db';
import express, { Request, Response } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import helmet from 'helmet';
import { rateLimiter } from './middlewares/rateLimiter.middleware';
import authRoutes from './modules/auth/auth.routes';
import projectRoutes from './modules/project/project.routes';
import reportRoutes from './modules/report/report.routes';
import uploadRoutes from './modules/upload/upload.routes';
import publicRoutes from './modules/public/public.routes';
import { globalErrorHandler } from './middlewares/error.middleware';
import logger from './utils/logger';

const app = express();

// ✅ TRUST PROXY (important for deployment like Render / Nginx)
app.set('trust proxy', 1);

// ✅ Security
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
  })
);

// ✅ CORS (FIRST — before rate limiter)
app.use(cors({
origin: config.clientUrl || 'http://localhost:3000',
credentials: true
}));

// ✅ Handle preflight requests
app.options('*', cors());

// ✅ Rate limiter (AFTER CORS)
app.use((req, res, next) => {
// Allow preflight to pass
if (req.method === 'OPTIONS') return next();
return rateLimiter(req, res, next);
});

// ✅ Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ✅ Logger
if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
}

// ✅ Static files
app.use('/api/uploads', express.static(path.join(__dirname, '../uploads')));

// ✅ Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/public', publicRoutes);

// ✅ Health check
app.get('/api/health', (req: Request, res: Response) => {
const dbStatus =
mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

res.json({
status: 'ok',
message: 'Backend API is running',
database: dbStatus,
timestamp: new Date().toISOString()
});
});

// ✅ Global error handler (LAST)
app.use(globalErrorHandler);

// ✅ Start server
const startServer = async () => {
await connectDB();

app.listen(config.port, '0.0.0.0', () => {
logger.info(`🚀 Backend API running on http://localhost:${config.port}`);
});
};

console.log('--- SERVER STARTING UP ---');

startServer().catch(err => {
console.error('FAILED TO START SERVER:', err);
});
