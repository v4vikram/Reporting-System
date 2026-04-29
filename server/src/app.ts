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

// Middleware
app.use(helmet());
app.use(rateLimiter);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Configure CORS for decoupled architecture
app.use(cors({
  origin: config.clientUrl,
  credentials: true
}));

app.use(morgan('dev'));
app.use(['/api/uploads', '/uploads'], express.static(path.join(__dirname, '../uploads')));

// Initialize DB and Start Server
const startServer = async () => {
    await connectDB();

    // API Routes
    app.use('/api/auth', authRoutes);
    app.use('/api/projects', projectRoutes);
    app.use('/api/reports', reportRoutes);
    app.use('/api/upload', uploadRoutes);
    app.use('/api/public', publicRoutes);
    
    app.get('/api/health', (req: Request, res: Response) => {
      res.json({ status: 'ok', message: 'Backend API is running' });
    });
    
    // Global Error Handler
    app.use(globalErrorHandler);
    
    app.listen(config.port, '0.0.0.0', () => {
      logger.info(`🚀 Backend API running on http://0.0.0.0:${config.port}`);
    });
};

console.log('--- SERVER STARTING UP ---');
startServer().catch(err => {
    console.error('FAILED TO START SERVER:', err);
});
