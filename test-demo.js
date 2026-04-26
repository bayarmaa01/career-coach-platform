const axios = require('axios');
const fs = require('fs');

async function testDemoMode() {
  try {
    console.log('🧪 Testing Demo AI Mode...');
    
    // Test 1: Simple chat message
    console.log('\n1. Testing chat endpoint...');
    const chatResponse = await axios.post('http://localhost:5000/api/ai/chat', {
      message: 'Tell me about career paths for a software developer'
    });
    console.log('✅ Chat Response:', chatResponse.data.response.substring(0, 200) + '...');
    
    // Test 2: Resume upload and analysis
    console.log('\n2. Testing resume upload and analysis...');
    const FormData = require('form-data');
    const form = new FormData();
    form.append('file', fs.createReadStream('CV2.pdf'));
    
    const uploadResponse = await axios.post('http://localhost:5000/api/resumes/upload', form, {
      headers: {
        ...form.getHeaders()
      }
    });
    console.log('✅ Resume uploaded successfully');
    console.log('Resume ID:', uploadResponse.data.id);
    
    // Test 3: Resume analysis
    if (uploadResponse.data.id) {
      console.log('\n3. Testing resume analysis...');
      const analysisResponse = await axios.get(`http://localhost:5000/api/resumes/${uploadResponse.data.id}/analyze`);
      console.log('✅ Analysis completed');
      console.log('Skills detected:', analysisResponse.data.skills?.length || 0);
      console.log('Career paths:', analysisResponse.data.recommendations?.careerPaths?.length || 0);
    }
    
    console.log('\n🎉 Demo AI Mode is working perfectly!');
    
  } catch (error) {
    console.error('❌ Error testing demo mode:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

testDemoMode();
