const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();
const PORT = 5000;

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Basic middleware
app.use(helmet({
  contentSecurityPolicy: false,
}));
app.use(compression());
app.use(morgan('dev'));

// CORS
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3100'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
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

// Health check endpoint
app.get('/api/health', async (req, res) => {
  console.log("Health endpoint called");
  try {
    res.status(200).json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: 'development'
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// AI chat endpoint
app.post('/api/ai/chat', async (req, res) => {
  console.log("AI chat endpoint called");
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    // Mock response for testing
    res.json({
      success: true,
      response: `Hello! You said: ${message}`,
      conversation_id: `chat_${Date.now()}`,
      suggestions: ["Try asking about resume tips", "Learn about interview preparation"]
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Error handling
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Minimal server is running on port ${PORT}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
});
