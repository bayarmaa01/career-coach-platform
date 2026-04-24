// Simple test server to isolate the issue
const express = require('express');
const app = express();
const PORT = 5001;

// Basic middleware
app.use(express.json());

// Simple test endpoint
app.get('/test', (req, res) => {
  console.log('Test endpoint called');
  res.json({ message: 'Server is working!', timestamp: new Date().toISOString() });
});

// Health endpoint
app.get('/api/health', (req, res) => {
  console.log('Health endpoint called');
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    message: 'Simple server health check'
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Simple test server running on port ${PORT}`);
  console.log(`Test: http://localhost:${PORT}/test`);
  console.log(`Health: http://localhost:${PORT}/api/health`);
});
