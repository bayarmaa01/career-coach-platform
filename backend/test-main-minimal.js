// Minimal version of main server to identify the issue
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 5004;

// Add request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Basic middleware
app.use(cors());
app.use(express.json());

// Test helmet middleware
const helmet = require('helmet');
app.use(helmet({
  contentSecurityPolicy: false,
}));

// Test compression middleware
const compression = require('compression');
app.use(compression());

// Test rate limiting middleware
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 900000,
  max: 100000,
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    return req.path === '/api/health';
  }
});
app.use(limiter);

// Health endpoint
app.get('/api/health', (req, res) => {
  console.log('Health endpoint called');
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    message: 'Main minimal server health check'
  });
});

// AI chat endpoint
app.post('/api/ai/chat', (req, res) => {
  console.log('AI chat endpoint called');
  res.json({
    success: true,
    response: "Main minimal server AI chat response!",
    conversation_id: `main_minimal_${Date.now()}`,
    suggestions: ["Suggestion 1", "Suggestion 2", "Suggestion 3"]
  });
});

// Test database configuration (like in main server)
const { Pool } = require('pg');
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'career_coach',
  user: 'postgres',
  password: 'password',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Test database connection (like in main server)
const testConnection = async () => {
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    console.log('Connected to PostgreSQL database successfully');
  } catch (error) {
    console.error('Database connection failed:', error);
    console.log('Database not available - continuing without database for AI testing');
  }
};

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Main minimal server running on port ${PORT}`);
  console.log(`Health: http://localhost:${PORT}/api/health`);
  console.log(`AI Chat: http://localhost:${PORT}/api/ai/chat`);
  
  // Test database connection (like in main server)
  setTimeout(testConnection, 5000);
});
