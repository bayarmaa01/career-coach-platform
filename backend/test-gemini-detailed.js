// Detailed test of Gemini service to see the exact error
const geminiService = require('./dist/services/gemini').default;

async function testGeminiDetailed() {
  console.log('Testing Gemini service with detailed error logging...');
  
  try {
    console.log('Using API key:', process.env.GEMINI_API_KEY ? 'Key exists' : 'No key found');
    console.log('Project name:', process.env.GEMINI_PROJECT_NAME);
    
    // Test with a simpler model name
    console.log('\n=== Testing with gemini-pro ===');
    const response = await geminiService.generateContent("Hello, how are you?", "gemini-pro");
    console.log('Gemini Response:', response);
    
  } catch (error) {
    console.error('Gemini Test Error:', error.message);
    
    // Log the full error response if available
    if (error.response && error.response.data) {
      console.error('Error Response Data:', JSON.stringify(error.response.data, null, 2));
    }
    
    // Log the actual response body if we can access it
    if (error.response && error.response.data && error.response.data.error) {
      console.error('Google API Error:', error.response.data.error.message);
      console.error('Google API Error Code:', error.response.data.error.code);
      console.error('Google API Error Status:', error.response.data.error.status);
    }
    
    if (error.response && error.response.status) {
      console.error('HTTP Status:', error.response.status);
      console.error('HTTP Status Text:', error.response.statusText);
    }
    
    console.error('Full error:', error);
  }
}

testGeminiDetailed();
