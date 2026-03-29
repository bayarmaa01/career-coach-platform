import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';

import authRoutes from './routes/auth';
import resumeRoutes from './routes/resume';
import careerRoutes from './routes/career';
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';
import pool from './config/database';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100000'),
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health endpoint
    return req.path === '/api/health' || process.env.DISABLE_RATE_LIMITING === 'true';
  }
});

// Security and middleware
app.use(helmet({
  contentSecurityPolicy: NODE_ENV === 'production' ? undefined : false,
}));
app.use(compression());
app.use(morgan(NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(limiter);

// CORS configuration
app.use(cors({
  origin: ['http://localhost:3100', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/resumes', resumeRoutes);
app.use('/api/career', careerRoutes);

// Health check endpoint
app.get('/api/health', async (req: Request, res: Response) => {
  try {
    // Test database connection
    const dbTest = await pool.query('SELECT NOW()');
    
    res.status(200).json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      database: 'connected',
      uptime: process.uptime(),
      environment: NODE_ENV
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message
    });
  }
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Start server
if (NODE_ENV !== 'test') {
  app.listen(PORT, (): void => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`📝 Environment: ${NODE_ENV}`);
    console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
  });
}

export default app;
