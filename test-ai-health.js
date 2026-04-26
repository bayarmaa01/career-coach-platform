const http = require('http');

function makeRequest(options) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          resolve({ status: res.statusCode, data: response });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });
    
    req.on('error', reject);
    req.end();
  });
}

async function testHealth() {
  try {
    console.log('🧪 Testing AI Health Endpoint...');
    
    const healthOptions = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/ai/health',
      method: 'GET'
    };
    
    const healthResponse = await makeRequest(healthOptions);
    console.log('✅ Health Response Status:', healthResponse.status);
    console.log('✅ Health Response:', JSON.stringify(healthResponse.data, null, 2));
    
  } catch (error) {
    console.error('❌ Error testing health:', error.message);
  }
}

testHealth();
