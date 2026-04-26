// Test Gemini API directly without server
require('dotenv').config({ path: '.env' });

const geminiService = require('./dist/services/gemini').default;

async function testGemini() {
  try {
    console.log("Testing Gemini API...");
    console.log("GEMINI_API_KEY:", process.env.GEMINI_API_KEY ? "SET" : "NOT SET");
    
    const response = await geminiService.generateContent("Hello, can you help me with career advice?");
    
    console.log("SUCCESS - Gemini Response:", response);
    return true;
  } catch (error) {
    console.error("ERROR - Gemini API Test Failed:", error.message);
    console.error("Full error:", error);
    return false;
  }
}

testGemini().then(success => {
  console.log("Test completed:", success ? "SUCCESS" : "FAILED");
  process.exit(success ? 0 : 1);
});
