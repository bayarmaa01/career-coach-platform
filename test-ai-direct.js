// Direct test of AI service
require('dotenv').config();

const aiService = require('./backend/dist/services/aiService').default;

async function testAI() {
  console.log('Testing AI service directly...');
  
  try {
    // Test chat functionality
    console.log('\n=== Testing Chat ===');
    const chatRequest = {
      message: "What skills do I need for a software engineering job?",
      user_profile: {
        name: "Test User",
        skills: ["JavaScript", "HTML", "CSS"],
        experience: "2 years",
        target_role: "Software Engineer"
      },
      conversation_id: "test-conversation"
    };
    
    const chatResponse = await aiService.chat(chatRequest);
    console.log('Chat Response:', JSON.stringify(chatResponse, null, 2));
    
    // Test recommendations functionality
    console.log('\n=== Testing Recommendations ===');
    const recRequest = {
      skills: ["JavaScript", "React", "Node.js"],
      interests: ["Web Development", "Programming"],
      target_role: "Full Stack Developer",
      experience_level: "Mid-level"
    };
    
    const recResponse = await aiService.getRecommendations(recRequest);
    console.log('Recommendations Response:', JSON.stringify(recResponse, null, 2));
    
  } catch (error) {
    console.error('AI Test Error:', error.message);
    console.error('Full error:', error);
  }
}

testAI();
