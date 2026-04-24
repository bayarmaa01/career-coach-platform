// Raw test to see the actual Gemini API response
const axios = require('axios');

async function testRawGemini() {
  console.log('Testing raw Gemini API call...');
  
  const apiKey = 'AIzaSyDiLz-GvOPpmLVxDH8nMBK99mkvQQyzyQ0';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;
  
  const requestBody = {
    contents: [
      {
        parts: [
          {
            text: "Hello, how are you?"
          }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 1024,
    }
  };

  try {
    console.log('Making request to:', url);
    console.log('Request body:', JSON.stringify(requestBody, null, 2));
    
    const response = await axios.post(url, requestBody, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.log('Success! Response:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('Error occurred:');
    console.error('Status:', error.response?.status);
    console.error('Status Text:', error.response?.statusText);
    
    if (error.response?.data) {
      console.error('Error Response:', JSON.stringify(error.response.data, null, 2));
    }
    
    console.error('Full error:', error.message);
  }
}

testRawGemini();
