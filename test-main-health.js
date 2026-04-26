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

async function testEndpoints() {
  try {
    console.log('🧪 Testing Main Health Endpoint...');
    
    // Test main health endpoint
    const healthOptions = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/health',
      method: 'GET'
    };
    
    const healthResponse = await makeRequest(healthOptions);
    console.log('✅ Main Health Status:', healthResponse.status);
    console.log('✅ Main Health Response:', JSON.stringify(healthResponse.data, null, 2));
    
    // Test AI health endpoint
    console.log('\n🧪 Testing AI Health Endpoint...');
    
    const aiHealthOptions = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/ai/health',
      method: 'GET'
    };
    
    const aiHealthResponse = await makeRequest(aiHealthOptions);
    console.log('✅ AI Health Status:', aiHealthResponse.status);
    console.log('✅ AI Health Response:', JSON.stringify(aiHealthResponse.data, null, 2));
    
    // Test AI chat endpoint
    console.log('\n🧪 Testing AI Chat Endpoint...');
    
    const chatOptions = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/ai/chat',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const chatData = JSON.stringify({
      message: 'Tell me about career paths for a software developer'
    });
    
    const chatResponse = await makeRequest(chatOptions, chatData);
    console.log('✅ Chat Status:', chatResponse.status);
    console.log('✅ Chat Response:', JSON.stringify(chatResponse.data, null, 2));
    
  } catch (error) {
    console.error('❌ Error testing endpoints:', error.message);
  }
}

testEndpoints();
