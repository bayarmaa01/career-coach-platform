// Test AI chat functionality
const http = require('http');

const testData = {
  message: "What skills do I need for a software engineering job?",
  user_profile: {
    name: "Test User",
    skills: ["JavaScript", "React"],
    experience: "2 years",
    target_role: "Software Engineer"
  },
  conversation_id: "test-conversation"
};

const postData = JSON.stringify(testData);

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/ai/chat',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData),
    'Authorization': 'Bearer test-token'
  }
};

console.log('Testing AI chat endpoint...');

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers: ${JSON.stringify(res.headers)}`);
  
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Response:', data);
    try {
      const jsonData = JSON.parse(data);
      console.log('Parsed response:', JSON.stringify(jsonData, null, 2));
      
      if (jsonData.success) {
        console.log('✅ AI Chat is working!');
        console.log('Response:', jsonData.response);
        console.log('Suggestions:', jsonData.suggestions);
      } else {
        console.log('❌ AI Chat failed:', jsonData.error);
      }
    } catch (e) {
      console.log('Failed to parse JSON:', e.message);
    }
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

// Write data to request body
req.write(postData);
req.end();
