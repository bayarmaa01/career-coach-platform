// Test debug server
const http = require('http');

const options = {
  hostname: 'localhost',
  port: 5003,
  path: '/api/health',
  method: 'GET'
};

console.log('Testing debug server health endpoint...');

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
      console.log('✅ Debug server working:', JSON.stringify(jsonData, null, 2));
    } catch (e) {
      console.log('Response is not JSON:', data);
    }
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.end();
