const express = require('express');
const app = express();

// Simple test endpoint
app.get('/test', (req, res) => {
  console.log("Test endpoint called");
  res.json({ message: "Test working" });
});

app.listen(5001, () => {
  console.log("Test server running on port 5001");
});
