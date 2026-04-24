// Minimal server to test basic functionality
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 5002;

// Basic middleware
app.use(cors());
app.use(express.json());

// Health endpoint
app.get('/api/health', (req, res) => {
  console.log('Health endpoint called');
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    message: 'Minimal server health check'
  });
});

// AI chat endpoint (mock)
app.post('/api/ai/chat', (req, res) => {
  console.log('AI chat endpoint called');
  res.json({
    success: true,
    response: "This is a mock response for testing. The AI chat functionality is working!",
    conversation_id: `test_${Date.now()}`,
    suggestions: ["Test suggestion 1", "Test suggestion 2", "Test suggestion 3"]
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Minimal test server running on port ${PORT}`);
  console.log(`Health: http://localhost:${PORT}/api/health`);
  console.log(`AI Chat: http://localhost:${PORT}/api/ai/chat`);
});
