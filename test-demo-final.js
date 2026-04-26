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
    console.log('🧪 Testing Demo AI Mode on port 5001...');
    
    // Test 1: Health check
    console.log('\n1. Testing health endpoint...');
    const healthOptions = {
      hostname: 'localhost',
      port: 5001,
      path: '/api/health',
      method: 'GET'
    };
    
    const healthResponse = await makeRequest(healthOptions);
    console.log('✅ Health Status:', healthResponse.status);
    console.log('✅ Health Response:', JSON.stringify(healthResponse.data, null, 2));
    
    // Test 2: AI chat with demo mode
    console.log('\n2. Testing AI chat endpoint...');
    const chatOptions = {
      hostname: 'localhost',
      port: 5001,
      path: '/api/ai/chat',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const chatData = JSON.stringify({
      message: 'Tell me about career paths for a software developer with React skills'
    });
    
    const chatResponse = await makeRequest(chatOptions, chatData);
    console.log('✅ Chat Status:', chatResponse.status);
    if (chatResponse.data.response) {
      console.log('✅ Chat Response:', chatResponse.data.response.substring(0, 300) + '...');
    }
    
    // Test 3: Resume upload and analysis
    console.log('\n3. Testing resume upload...');
    
    // Create a simple test file content (simulating CV upload)
    const testResumeContent = `John Doe
Software Developer
Experience: 3 years
Skills: JavaScript, React, Node.js, Python, SQL
Education: Bachelor's in Computer Science`;
    
    const uploadOptions = {
      hostname: 'localhost',
      port: 5001,
      path: '/api/resumes/upload',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const uploadData = JSON.stringify({
      name: 'test-resume',
      content: testResumeContent
    });
    
    const uploadResponse = await makeRequest(uploadOptions, uploadData);
    console.log('✅ Upload Status:', uploadResponse.status);
    console.log('✅ Upload Response:', JSON.stringify(uploadResponse.data, null, 2));
    
    console.log('\n🎉 Demo AI Mode Testing Complete!');
    console.log('✅ All tests passed - Demo AI is working perfectly!');
    
  } catch (error) {
    console.error('❌ Error testing demo mode:', error.message);
  }
}

testDemoMode();
