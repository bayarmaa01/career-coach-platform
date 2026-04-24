// Test to list available Gemini models
const axios = require('axios');

async function testListModels() {
  console.log('Testing list of available Gemini models...');
  
  const apiKey = 'AIzaSyDiLz-GvOPpmLVxDH8nMBK99mkvQQyzyQ0';
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

  try {
    console.log('Making request to:', url);
    
    const response = await axios.get(url);
    
    console.log('Available models:');
    response.data.models.forEach((model, index) => {
      console.log(`${index + 1}. Name: ${model.name}`);
      console.log(`   Display Name: ${model.displayName}`);
      console.log(`   Description: ${model.description}`);
      console.log(`   Supported Methods: ${model.supportedGenerationMethods?.join(', ') || 'None'}`);
      console.log('');
    });
    
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

testListModels();
