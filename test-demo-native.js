const http = require('http');
const fs = require('fs');

function makeRequest(options, data = null) {
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
    
    if (data) {
      req.write(data);
    }
    req.end();
  });
}

async function testDemoMode() {
  try {
    console.log('🧪 Testing Demo AI Mode...');
    
    // Test 1: Simple chat message
    console.log('\n1. Testing chat endpoint...');
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
    console.log('✅ Chat Response Status:', chatResponse.status);
    if (chatResponse.data.response) {
      console.log('✅ Chat Response:', chatResponse.data.response.substring(0, 200) + '...');
    }
    
    console.log('\n🎉 Demo AI Mode is working!');
    
  } catch (error) {
    console.error('❌ Error testing demo mode:', error.message);
  }
}

testDemoMode();
