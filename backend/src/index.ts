import dotenv from 'dotenv';
import path from 'path';

// Load environment variables FIRST before any other imports
const envPath = path.join(__dirname, '../../.env.production');
console.log("DEBUG - ENV PATH:", envPath);
dotenv.config({ path: envPath });

import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import client from 'prom-client';

import authRoutes from './routes/auth';
import resumeRoutes from './routes/resume';
import careerRoutes from './routes/career';
import aiRoutes from './routes/aiRoutes';
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';
// import pool from './config/database'; // Temporarily disabled

// Try to read the .env file directly to debug
const fs = require('fs');
try {
  const envContent = fs.readFileSync(envPath, 'utf8');
  console.log("DEBUG - ENV FILE CONTENT:", envContent);
} catch (error) {
  console.log("DEBUG - CANNOT READ ENV FILE:", error);
}

dotenv.config({ path: envPath });

// Debug logging for environment variables
console.log("DEBUG - GEMINI_API_KEY:", process.env.GEMINI_API_KEY ? "SET" : "NOT SET");

// Prometheus metrics setup
const register = new client.Registry();
client.collectDefaultMetrics({ register });

// Custom metrics
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

const httpRequestTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

const activeConnections = new client.Gauge({
  name: 'active_connections',
  help: 'Number of active connections',
  registers: [register],
});

const app: Application = express();
const PORT = process.env.PORT || 5001;
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

// Security and middleware (temporarily disabled for debugging)
// app.use(helmet({
//   contentSecurityPolicy: NODE_ENV === 'production' ? undefined : false,
// }));
// app.use(compression());
// app.use(morgan(NODE_ENV === 'production' ? 'combined' : 'dev'));
// app.use(limiter);

// CORS configuration
const allowedOrigins = [
  'http://localhost:3100',
  'http://localhost:3000',
  'http://frontend-service:3100',
  process.env.FRONTEND_URL,
  process.env.CORS_ORIGIN
].filter((origin): origin is string => Boolean(origin));

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Metrics middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  activeConnections.inc();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route ? req.route.path : req.path;
    
    httpRequestDuration
      .labels(req.method, route, res.statusCode.toString())
      .observe(duration);
    
    httpRequestTotal
      .labels(req.method, route, res.statusCode.toString())
      .inc();
    
    activeConnections.dec();
  });
  
  next();
});

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`🔍 DEBUG - Incoming request: ${req.method} ${req.path}`);
  console.log(`🔍 DEBUG - Full URL: ${req.url}`);
  console.log(`🔍 DEBUG - Headers:`, req.headers);
  next();
});

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API routes
console.log("DEBUG - Mounting routes...");
app.use('/api/auth', authRoutes);
app.use('/api/resumes', resumeRoutes);
app.use('/api/career', careerRoutes);
app.use('/api/ai', aiRoutes);
console.log("DEBUG - Routes mounted successfully");

// Health check endpoint
app.get('/api/health', async (req: Request, res: Response) => {
  console.log("DEBUG - Health endpoint called");
  try {
    // Temporarily skip database check to isolate the issue
    let dbStatus = 'disconnected';
    
    res.status(200).json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      database: dbStatus,
      uptime: process.uptime(),
      environment: NODE_ENV
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Prometheus metrics endpoint
app.get('/metrics', async (req: Request, res: Response) => {
  try {
    // Ensure metrics are collected before returning
    const metrics = await register.metrics();
    res.setHeader('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
    res.status(200).send(metrics);
  } catch (error) {
    console.error('Metrics endpoint error:', error);
    res.setHeader('Content-Type', 'text/plain');
    res.status(500).send('# Error generating metrics\n# HELP prometheus_metrics_failed_total Total number of failed metrics generation\n# TYPE prometheus_metrics_failed_total counter\nprometheus_metrics_failed_total 1\n');
  }
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Start server
if (NODE_ENV !== 'test') {
  const portNumber = typeof PORT === 'string' ? parseInt(PORT, 10) : PORT;
  app.listen(portNumber, '0.0.0.0', (): void => {
    console.log(`🚀 Server is running on port ${portNumber}`);
    console.log(`📝 Environment: ${NODE_ENV}`);
    console.log(`🏥 Health check: http://localhost:${portNumber}/api/health`);
  });
}

export default app;
