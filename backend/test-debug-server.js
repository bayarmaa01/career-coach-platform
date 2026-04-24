// Debug server to identify the hanging issue
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 5003;

// Add detailed logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Basic middleware
app.use(cors());
app.use(express.json());

// Health endpoint with detailed logging
app.get('/api/health', (req, res) => {
  console.log('Health endpoint handler called');
  try {
    const response = { 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      message: 'Debug server health check'
    };
    console.log('Sending response:', response);
    res.json(response);
  } catch (error) {
    console.error('Error in health endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// AI chat endpoint with detailed logging
app.post('/api/ai/chat', (req, res) => {
  console.log('AI chat endpoint handler called');
  console.log('Request body:', req.body);
  try {
    const response = {
      success: true,
      response: "This is a debug response. The AI chat functionality is working!",
      conversation_id: `debug_${Date.now()}`,
      suggestions: ["Debug suggestion 1", "Debug suggestion 2", "Debug suggestion 3"]
    };
    console.log('Sending AI response:', response);
    res.json(response);
  } catch (error) {
    console.error('Error in AI chat endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Catch-all handler
app.use('*', (req, res) => {
  console.log(`Catch-all handler called for: ${req.method} ${req.url}`);
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error handler called:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server with detailed logging
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Debug server running on port ${PORT}`);
  console.log(`Health: http://localhost:${PORT}/api/health`);
  console.log(`AI Chat: http://localhost:${PORT}/api/ai/chat`);
  console.log('Server started successfully');
});
