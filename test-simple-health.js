// Test simple server health endpoint
const http = require('http');

const options = {
  hostname: 'localhost',
  port: 5001,
  path: '/api/health',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
};

console.log('Testing simple server health endpoint...');

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Response:', data);
    try {
      const jsonData = JSON.parse(data);
      console.log('✅ Simple server working:', JSON.stringify(jsonData, null, 2));
    } catch (e) {
      console.log('Response is not JSON:', data);
    }
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.end();
